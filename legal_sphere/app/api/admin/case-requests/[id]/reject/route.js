import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { publishCaseNotification } from "@/lib/kafka";
import { ObjectId } from "mongodb";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Case ID is required" }, { status: 400 });
    }

    const { status, rejectionReason } = body;
    
    if (status !== "rejected") {
      return NextResponse.json({ error: "Invalid status for rejection" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("case_requests");

    // Find case first
    const caseRequest = await collection.findOne({ 
      $or: [{ id: id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])]
    });

    if (!caseRequest) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Delete uploaded documents from Cloudflare R2
    if (caseRequest.documents && caseRequest.documents.length > 0) {
      try {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || "auto",
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
          },
        });

        const documentKeys = caseRequest.documents
          .filter(doc => doc.key && doc.key.includes("case-submissions/"))
          .map(doc => ({ Key: doc.key }));

        if (documentKeys.length > 0) {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Delete: {
              Objects: documentKeys,
              Quiet: false,
            },
          });

          await s3Client.send(deleteCommand);
          console.log(`Deleted ${documentKeys.length} documents from R2 for case ${id}`);
        }
      } catch (s3Err) {
        console.error("Failed to delete documents from R2:", s3Err);
        // Continue with rejection even if document deletion fails
      }
    }

    // Update case status (keep the record for audit trail but don't show in admin)
    const updateQuery = {
      $or: [{ id: id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])]
    };
    
    const updateResult = await collection.updateOne(
      updateQuery,
      {
        $set: {
          status: "rejected",
          rejectionReason: rejectionReason || "Case rejected by administrator",
          updatedAt: new Date().toISOString(),
          rejectedAt: new Date().toISOString(),
          documents: [], // Clear documents array since files are deleted
          hidden: true // Hide from admin dashboard view
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Persist notification to MongoDB (must happen even if Kafka is down)
    const clientIdentifier = caseRequest.clientId || caseRequest.client?.id || caseRequest.client?.email;
    const clientEmail = caseRequest.client?.email;
    try {
      const notificationsCollection = db.collection("notifications");
      const notificationDoc = {
        clientId: clientIdentifier,
        clientEmail: clientEmail,
        caseId: id,
        notificationType: "case_rejected",
        title: "Case Rejected",
        message: `Your case "${caseRequest.case?.title || 'Untitled Case'}" has been rejected by the administrator.`,
        metadata: {
          rejectionReason: rejectionReason || "Case rejected by administrator",
          rejectedAt: new Date().toISOString()
        },
        read: false,
        createdAt: new Date().toISOString()
      };

      await notificationsCollection.insertOne(notificationDoc);
      console.log("Notification stored directly in MongoDB");
    } catch (dbErr) {
      console.error("Failed to store rejection notification in MongoDB:", dbErr);
    }

    // Best-effort Kafka publish (optional)
    try {
      const notificationMessage = {
        event_type: "case_notification",
        timestamp: new Date().toISOString(),
        data: {
          clientId: clientIdentifier,
          caseId: id,
          notificationType: "case_rejected",
          title: "Case Rejected",
          message: `Your case "${caseRequest.case?.title || 'Untitled Case'}" has been rejected by the administrator.`,
          metadata: {
            rejectionReason: rejectionReason || "Case rejected by administrator",
            rejectedAt: new Date().toISOString()
          }
        }
      };

      await publishCaseNotification(notificationMessage, clientIdentifier);
    } catch (kafkaErr) {
      console.error("Failed to publish rejection notification to Kafka:", kafkaErr);
    }

    return NextResponse.json({
      message: "Case rejected successfully",
      caseId: id,
      status: "rejected",
      rejectionReason,
      documentsDeleted: caseRequest.documents?.length || 0
    });

  } catch (err) {
    console.error("Error rejecting case:", err);
    
    if (err instanceof ObjectId && err.message.includes("invalid ObjectId")) {
      return NextResponse.json({ error: "Invalid case ID format" }, { status: 400 });
    }
    
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

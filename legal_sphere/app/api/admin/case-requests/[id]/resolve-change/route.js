import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { publishCaseNotification } from "@/lib/kafka";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { approved, adminNotes } = body;

    const db = await getDb();
    const col = db.collection("case_requests");

    const query = {
      $or: [
        { id: id },
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
      ],
    };

    const caseDoc = await col.findOne(query);
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Process approval or denial
    if (approved) {
      const currentLawyerId = caseDoc.assignedLawyerId;
      const clientEmail = caseDoc.client?.email;
      const caseTitle = caseDoc.case?.title || "Your Case";

      const updateData = {
        $unset: { assignedLawyerId: "", assignedLawyer: "" },
        $set: {
          status: "pending_admin_review", // Return to admin queue
          "reassignmentRequest.status": "approved",
          "reassignmentRequest.resolvedAt": new Date().toISOString(),
          "reassignmentRequest.adminNotes": adminNotes || "",
        },
      };
      
      if (currentLawyerId) {
        updateData.$push = { deniedLawyerIds: currentLawyerId };
      }

      await col.updateOne(query, updateData);

      // Deactivate associated active chat
      const chatsCol = db.collection("chats");
      // Need to find chats associated with this case and case_id (as string)
      await chatsCol.updateMany(
        { case_id: id, is_active: true },
        { $set: { is_active: false } }
      );
      
      // Also potentially check with _id if case_id was stored as string of ObjectId
      if (caseDoc._id) {
         await chatsCol.updateMany(
          { case_id: caseDoc._id.toString(), is_active: true },
          { $set: { is_active: false } }
        );
      }

      // Kafka notifications
      try {
        if (currentLawyerId) {
          // Notify old lawyer
          await publishCaseNotification({
            event_type: "case_notification",
            timestamp: new Date().toISOString(),
            data: {
              clientId: currentLawyerId.toString(),
              caseId: id,
              notificationType: "lawyer_removed",
              title: "Case Reassigned",
              message: `You have been removed from case: ${caseTitle}`,
            },
          });
        }
        
        if (clientEmail) {
          // Notify client
          await publishCaseNotification({
            event_type: "case_notification",
            timestamp: new Date().toISOString(),
            data: {
              clientId: clientEmail,
              caseId: id,
              notificationType: "reassignment_approved",
              title: "Lawyer Change Approved",
              message: `Your request to change lawyer for case ${caseTitle} has been approved. We are assigning a new lawyer.`,
            },
          });
        }
      } catch (kafkaErr) {
        console.error("Kafka publish error in resolve-change:", kafkaErr);
        // Continue, don't fail the API
      }
    } else {
      // Denied
      const clientEmail = caseDoc.client?.email;
      const caseTitle = caseDoc.case?.title || "Your Case";

      await col.updateOne(query, {
        $set: {
          "reassignmentRequest.status": "denied",
          "reassignmentRequest.resolvedAt": new Date().toISOString(),
          "reassignmentRequest.adminNotes": adminNotes || "",
        },
      });

      // Notify client
      try {
        if (clientEmail) {
          await publishCaseNotification({
            event_type: "case_notification",
            timestamp: new Date().toISOString(),
            data: {
              clientId: clientEmail,
              caseId: id,
              notificationType: "reassignment_denied",
              title: "Lawyer Change Denied",
              message: `Your request to change lawyer for case ${caseTitle} was not approved. ${adminNotes || ""}`,
            },
          });
        }
      } catch (kafkaErr) {
        console.error("Kafka publish error in resolve-change:", kafkaErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin resolve-change error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

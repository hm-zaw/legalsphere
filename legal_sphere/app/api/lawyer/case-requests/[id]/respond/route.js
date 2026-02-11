import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { publishCaseNotification } from "@/lib/kafka";
import { ObjectId } from "mongodb";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, lawyerId, reason } = body; // status: 'accepted' | 'denied'

    if (!id) {
      return NextResponse.json({ error: "Case ID is required" }, { status: 400 });
    }
    if (!['accepted', 'denied'].includes(status)) {
      return NextResponse.json({ error: "Status must be 'accepted' or 'denied'" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("case_requests");

    const query = { 
        $or: [{ id: id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])]
    };
    const caseRequest = await collection.findOne(query);

    if (!caseRequest) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const clientIdentifier = caseRequest.clientId || caseRequest.client?.id || caseRequest.client?.email || "unknown_client";
    const now = new Date().toISOString();

    if (status === 'accepted') {
        // Update DB
        await collection.updateOne(query, {
            $set: {
                status: 'active',
                lawyerAcceptedAt: now,
                updatedAt: now
            }
        });

        // Publish Kafka Event
        await publishCaseNotification({
            event_type: "case_notification",
            timestamp: now,
            data: {
                clientId: clientIdentifier,
                caseId: id,
                notificationType: "case_accepted",
                title: "Case Accepted",
                message: `Lawyer has accepted the case assignment.`,
                metadata: {
                    lawyerId: lawyerId || caseRequest.assignedLawyerId,
                    acceptedAt: now
                }
            }
        }, clientIdentifier);

    } else if (status === 'denied') {
        // Update DB
        const updateOp = {
            $set: {
                status: 'pending_admin_review',
                assignedLawyer: null,
                assignedLawyerId: null,
                updatedAt: now
            }
        };
        
        // Add to denied list
        if (lawyerId) {
            updateOp['$addToSet'] = { deniedLawyerIds: lawyerId };
        }

        await collection.updateOne(query, updateOp);

        // Publish Kafka Event
        await publishCaseNotification({
            event_type: "case_notification",
            timestamp: now,
            data: {
                clientId: clientIdentifier,
                caseId: id,
                notificationType: "case_denied",
                title: "Case Assignment Denied",
                message: `Lawyer denied the case assignment.`,
                metadata: {
                    lawyerId: lawyerId,
                    denialReason: reason,
                    deniedAt: now
                }
            }
        }, "admin-notifications"); // Key can be admin or just general topic
    }

    return NextResponse.json({
      message: `Case ${status} successfully`,
      caseId: id,
      status: status
    });

  } catch (err) {
    console.error("Error processing lawyer response:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

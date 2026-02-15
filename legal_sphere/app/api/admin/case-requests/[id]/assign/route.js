import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { publishCaseNotification } from "@/lib/kafka";
import { ObjectId } from "mongodb";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lawyerId, lawyerName } = body;

    if (!id) {
      return NextResponse.json({ error: "Case ID is required" }, { status: 400 });
    }
    if (!lawyerId || !lawyerName) {
      return NextResponse.json({ error: "Lawyer ID and Name are required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("case_requests");

    // Check if case exists
    const query = { 
        $or: [{ id: id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])]
    };
    const caseRequest = await collection.findOne(query);

    if (!caseRequest) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const clientIdentifier = caseRequest.clientId || caseRequest.client?.id || caseRequest.client?.email || "unknown_client";

    // 1. Update Database Immediately (Optimistic)
    const updateResult = await collection.updateOne(
        query,
        {
            $set: {
                status: 'lawyer_assigned',
                assignedLawyer: {
                    id: lawyerId,
                    name: lawyerName,
                    assignedAt: new Date().toISOString()
                },
                assignedLawyerId: lawyerId,
                updatedAt: new Date().toISOString()
            }
        }
    );

    // 2. Publish Kafka Event
    const notificationMessage = {
      event_type: "case_notification",
      timestamp: new Date().toISOString(),
      data: {
        clientId: clientIdentifier,
        caseId: id,
        notificationType: "case_assigned",
        title: "Lawyer Assigned",
        message: `Case assigned to ${lawyerName}`,
        metadata: {
          lawyerId: lawyerId,
          lawyerName: lawyerName,
          assignedAt: new Date().toISOString()
        }
      }
    };

    await publishCaseNotification(notificationMessage, String(clientIdentifier || lawyerId));

    return NextResponse.json({
      message: "Case assigned successfully",
      caseId: id,
      assignedLawyer: { id: lawyerId, name: lawyerName }
    });

  } catch (err) {
    console.error("Error assigning case:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

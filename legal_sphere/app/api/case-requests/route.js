import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { publishCaseSubmission } from "@/lib/kafka";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || (!body.clientId && !body.client) || !body.case) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const id = crypto.randomUUID();

    const caseData = {
      ...body,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: "pending_submission",
      source: "web_form",
    };

    const message = {
      event_type: "case_submission",
      timestamp: nowIso,
      data: caseData,
    };

    try {
      await publishCaseSubmission(message, id);
    } catch (kafkaErr) {
      // Fallback: store directly in MongoDB if Kafka fails
      try {
        const db = await getDb();
        const collection = db.collection("case_requests");
        await collection.insertOne(caseData);
        return NextResponse.json(
          { id, message: "Case submitted successfully (direct storage)", status: "submitted" },
          { status: 201 }
        );
      } catch (dbErr) {
        console.error("Kafka publish failed and MongoDB fallback failed:", kafkaErr, dbErr);
        return NextResponse.json({ error: "Failed to process case" }, { status: 500 });
      }
    }

    return NextResponse.json({ id, message: "Case submitted successfully", status: "submitted" }, { status: 201 });
  } catch (err) {
    console.error("Error creating case request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

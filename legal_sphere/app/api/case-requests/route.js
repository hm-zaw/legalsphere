import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import crypto from "crypto";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("case_requests");

    // Exclude rejected and hidden cases for client view
    // NOTE: older sessions may only have email in localStorage (backend previously removed user.id).
    // We treat `clientId` as a generic identifier and match either stored clientId or client.email.
    const query = {
      $and: [
        {
          $or: [
            { clientId: clientId },
            { "client.email": clientId },
          ],
        },
        { status: { $ne: "rejected" } },
        { hidden: { $ne: true } },
      ],
    };

    const cases = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Helper to format status strings (e.g., "analysis_completed" -> "Analysis Completed")
    const formatStatus = (status) => {
      if (!status) return "Pending";
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Transform case data to match the expected format
    const formattedCases = cases.map(caseItem => ({
      id: caseItem.id || caseItem._id?.toString(), // Ensure ID is always present
      title: caseItem.case?.title || caseItem.title || 'Untitled Case',
      category: caseItem.case?.category || caseItem.category || 'General',
      status: formatStatus(caseItem.status),
      priority: caseItem.priority || caseItem.case?.urgency || 'Normal',
      progress: caseItem.progress || 0,
      submittedDate: caseItem.createdAt,
      lastUpdated: caseItem.updatedAt || caseItem.createdAt,
      lawyer: caseItem.lawyer?.name || caseItem.lawyer || 'Pending Assignment',
      amount: caseItem.amount || 'TBD',
      description: caseItem.case?.description || caseItem.description || 'No description available',
      client: caseItem.client,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt
    }));

    return NextResponse.json({
      cases: formattedCases,
      pagination: {
        page,
        limit,
        total: formattedCases.length,
        pages: Math.ceil(formattedCases.length / limit)
      }
    });

  } catch (err) {
    console.error("Error fetching client cases:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

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

    // Store directly in MongoDB
    try {
      const db = await getDb();
      const collection = db.collection("case_requests");
      await collection.insertOne(caseData);
      return NextResponse.json(
        { id, message: "Case submitted successfully", status: "submitted" },
        { status: 201 }
      );
    } catch (dbErr) {
      console.error("Failed to store case in MongoDB:", dbErr);
      return NextResponse.json({ error: "Failed to process case" }, { status: 500 });
    }
  } catch (err) {
    console.error("Error creating case request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("notifications");

    // Support both id-based and email-based identifiers.
    // Older sessions may only have email in localStorage.
    const query = {
      $or: [{ clientId }, { clientEmail: clientId }],
    };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      notifications,
      unreadCount: await collection.countDocuments({ $or: [{ clientId }, { clientEmail: clientId }], read: false })
    });

  } catch (err) {
    console.error("Error fetching notifications:", err);
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
    const { clientId, clientEmail, caseId, notificationType, title, message, metadata } = body;

    if (!clientId || !notificationType || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("notifications");

    const notification = {
      clientId,
      clientEmail: clientEmail || undefined,
      caseId,
      notificationType,
      title,
      message,
      metadata: metadata || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    const result = await collection.insertOne(notification);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...notification
    }, { status: 201 });

  } catch (err) {
    console.error("Error creating notification:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

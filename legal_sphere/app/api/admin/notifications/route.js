import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const db = await getDb();
    const collection = db.collection("admin_notifications");

    const query = {};
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
      unreadCount: await collection.countDocuments({ read: false })
    });

  } catch (err) {
    console.error("Error fetching admin notifications:", err);
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
    const { notificationId, action } = body; // action: 'mark_read', 'mark_all_read'

    const db = await getDb();
    const collection = db.collection("admin_notifications");

    if (action === 'mark_read' && notificationId) {
      await collection.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true, readAt: new Date().toISOString() } }
      );
    } else if (action === 'mark_all_read') {
      await collection.updateMany(
        { read: false },
        { $set: { read: true, readAt: new Date().toISOString() } }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Error updating admin notifications:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    console.log("Attempting to delete notification with ID:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id?.length);

    const db = await getDb();
    const collection = db.collection("admin_notifications");
    
    // First, try to find the notification to see what exists
    const existingNotification = await collection.findOne({ _id: new ObjectId(id) });
    console.log("Found notification:", existingNotification);
    
    if (!existingNotification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    console.log("Delete result:", result);
    
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Error deleting admin notification:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

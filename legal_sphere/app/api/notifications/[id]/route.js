import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("notifications");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Notification deleted",
      notificationId: id
    });

  } catch (err) {
    console.error("Error deleting notification:", err);

    if (err.message?.includes("invalid ObjectId")) {
      return NextResponse.json({ error: "Invalid notification ID format" }, { status: 400 });
    }

    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

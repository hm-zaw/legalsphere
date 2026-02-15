import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    console.log(
      "[api/admin/notifications/[id]/DELETE] Deleting notification id:",
      id,
    );

    const db = await getDb();
    const collection = db.collection("admin_notifications");

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 },
      );
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    const result = await collection.deleteOne({ _id: objectId });
    console.log("[api/admin/notifications/[id]/DELETE] delete result:", result);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting admin notification (dynamic):", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const db = await getDb();
    const collection = db.collection("case_requests");

    // Build query based on status
    let query = {};
    if (status === "incoming") {
      query = { status: "lawyer_assigned" };
    } else if (status) {
      query = { status };
    }

    // If a lawyerId is provided, only return cases assigned to that lawyer
    let resolvedLawyerId = searchParams.get("lawyerId");

    // Derive lawyer identity from server-side cookie auth when available
    try {
      const auth = getUserFromRequest(request);
      if (auth && auth.user && auth.user.id && auth.role === "lawyer") {
        resolvedLawyerId = String(auth.user.id);
      }
    } catch (e) {
      // ignore and fall back to query param
    }
    if (resolvedLawyerId) {
      // Match either assignedLawyerId field or nested assignedLawyer.id
      query = {
        ...query,
        $or: [
          { assignedLawyerId: resolvedLawyerId },
          { "assignedLawyer.id": resolvedLawyerId },
        ],
      };
    }

    // Fetch cases
    const cases = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      cases: cases,
      count: cases.length,
    });
  } catch (err) {
    console.error("Error fetching lawyer cases:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

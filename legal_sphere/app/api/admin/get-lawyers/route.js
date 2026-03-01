import { NextResponse } from 'next/server';
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Call Flask backend to get lawyers
    const response = await fetch('http://localhost:5000/api/auth/admin/get-lawyers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Error || data.Message || "Failed to fetch lawyers" },
        { status: response.status }
      );
    }

    // Embed real case counts from MongoDB
    try {
       const db = await getDb();
       const counts = await db.collection("case_requests").aggregate([
          { $match: { hidden: { $ne: true }, status: { $ne: "completed" }, assignedLawyerId: { $ne: null } } },
          { $group: { _id: "$assignedLawyerId", count: { $sum: 1 } } }
       ]).toArray();
       
       const countMap = {};
       for (const group of counts) {
           if (group._id !== null && group._id !== undefined) {
               countMap[group._id.toString()] = group.count;
           }
       }
       
       if (Array.isArray(data.Lawyers)) {
           data.Lawyers = data.Lawyers.map(lawyer => {
               const idToMatch = (lawyer.user_id || lawyer.id || "").toString();
               return {
                   ...lawyer,
                   activeCases: countMap[idToMatch] || 0
               };
           });
       }
    } catch (dbErr) {
       console.error("Error embedding active cases:", dbErr);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json(
      { error: "Network error" },
      { status: 500 }
    );
  }
}

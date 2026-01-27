import { NextResponse } from "next/server";

const FLASK_BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5000";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      specialization, 
      experience, 
      availability, 
      case_history_summary,
      phone,
      barNumber
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Get authorization token from request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Forward request to Flask backend
    const response = await fetch(`${FLASK_BACKEND_URL}/api/auth/admin/create-lawyer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        specialization: specialization || null,
        experience: experience || null,
        availability: availability || "Available",
        case_history_summary: case_history_summary || null,
        phone: phone || null,
        barNumber: barNumber || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Error || "Failed to create lawyer" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { 
        message: "Lawyer created successfully", 
        lawyer: data 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error in create-lawyer API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

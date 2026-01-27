import { NextResponse } from 'next/server';

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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json(
      { error: "Network error" },
      { status: 500 }
    );
  }
}

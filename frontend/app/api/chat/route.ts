import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mode = 'chat' } = await req.json();

    // Forward to FastAPI backend
    const response = await fetch('http://0.0.0.0:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, mode }),
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { response: 'Sorry, there was an error processing your request.' },
      { status: 500 }
    );
  }
}
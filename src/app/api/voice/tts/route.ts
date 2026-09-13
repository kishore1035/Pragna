import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Returns 204 or empty audio buffer if invoked directly
    return new NextResponse(new Uint8Array([]), {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

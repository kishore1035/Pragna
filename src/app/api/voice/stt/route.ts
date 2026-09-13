import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Return empty transcript fallback or basic placeholder if file sent
    return NextResponse.json({ text: '' });
  } catch {
    return NextResponse.json({ text: '' }, { status: 200 });
  }
}

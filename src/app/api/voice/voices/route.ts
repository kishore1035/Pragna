import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    voices: [
      {
        id: 'pragna-warm',
        name: 'Pragna (Warm & Empathetic)',
        gender: 'female',
        locale: 'en-US',
        accent: 'Warm & Natural',
        recommended: true,
      },
      {
        id: 'pragna-expressive',
        name: 'Pragna (Vibrant & Expressive)',
        gender: 'female',
        locale: 'en-US',
        accent: 'Emotional & Dynamic',
      },
      {
        id: 'pragna-gentle',
        name: 'Pragna (Gentle & Calming)',
        gender: 'female',
        locale: 'en-US',
        accent: 'Soft & Reassuring',
      },
      {
        id: 'pragna-british',
        name: 'Pragna (Melodic British)',
        gender: 'female',
        locale: 'en-GB',
        accent: 'Polished & Friendly',
      },
    ],
  });
}

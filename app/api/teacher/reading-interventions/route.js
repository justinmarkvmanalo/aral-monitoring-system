import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { generateReadingInterventionSuggestions } from '@/lib/groq';

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!payload?.studentName || !payload?.transcript || !payload?.level) {
    return NextResponse.json({ error: 'Missing reading analysis details.' }, { status: 400 });
  }

  try {
    const suggestions = await generateReadingInterventionSuggestions(payload);
    if (!suggestions) {
      return NextResponse.json(
        { error: 'Groq is not configured yet. Set GROQ_API_KEY on the server.' },
        { status: 503 }
      );
    }

    return NextResponse.json(suggestions, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Failed to generate reading intervention suggestions:', error);
    return NextResponse.json(
      { error: 'Unable to generate AI intervention suggestions right now.' },
      { status: 502 }
    );
  }
}

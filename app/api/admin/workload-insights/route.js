import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { getAdminWorkloadAnalytics } from '@/lib/data';
import { generateAdminWorkloadInsights } from '@/lib/groq';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const workloadAnalytics = await getAdminWorkloadAnalytics();
    const insights = await generateAdminWorkloadInsights(workloadAnalytics);

    if (!insights) {
      return NextResponse.json(
        { error: 'Groq is not configured yet. Set GROQ_API_KEY on the server.' },
        { status: 503 }
      );
    }

    return NextResponse.json(insights, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Failed to generate admin workload insights:', error);
    return NextResponse.json(
      { error: 'Unable to generate workload insights right now.' },
      { status: 502 }
    );
  }
}

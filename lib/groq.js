const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your-groq-api-key') {
    return null;
  }
  return key;
}

function buildWorkloadPrompt(workloadAnalytics) {
  const teacherLoads = workloadAnalytics.teacherLoads.slice(0, 8).map((teacher) => ({
    teacherName: teacher.teacherName,
    sectionName: teacher.sectionName,
    learnerCount: teacher.learnerCount,
    interventionHours: teacher.interventionHours,
    escalationLearnerCount: teacher.escalationLearnerCount,
    overloadLevel: teacher.overloadLevel,
    overloadReasons: teacher.overloadReasons
  }));
  const escalationLearners = workloadAnalytics.escalationLearners.slice(0, 8).map((learner) => ({
    learnerName: `${learner.last_name}, ${learner.first_name}`,
    teacherName: learner.teacher_name,
    reasons: learner.reasons
  }));

  return JSON.stringify(
    {
      totals: workloadAnalytics.totals,
      estimationNote: workloadAnalytics.estimationNote,
      teacherLoads,
      escalationLearners
    },
    null,
    2
  );
}

export async function generateAdminWorkloadInsights(workloadAnalytics) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return null;
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    cache: 'no-store',
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.2,
      max_completion_tokens: 700,
      response_format: {
        type: 'json_object'
      },
      messages: [
        {
          role: 'system',
          content:
            'You are an education operations analyst for an ARAL reading support program. Return only JSON with keys headline, summary, alerts, recommendations. alerts and recommendations must be arrays of at most 3 short strings each.'
        },
        {
          role: 'user',
          content: `Review this teacher workload data and identify overload risk, escalation pressure, and staffing priorities.\n\n${buildWorkloadPrompt(workloadAnalytics)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const rawContent = payload?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Groq response did not include message content.');
  }

  const parsed = JSON.parse(rawContent);
  return {
    headline: String(parsed.headline || 'Teacher workload overview'),
    summary: String(parsed.summary || ''),
    alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 3).map(String) : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map(String)
      : []
  };
}

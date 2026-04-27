const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your-groq-api-key') {
    return null;
  }
  return key;
}

function truncateText(value, maxLength = 1200) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

async function requestGroqJson({ systemPrompt, userPrompt, maxCompletionTokens = 700 }) {
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
      max_completion_tokens: maxCompletionTokens,
      response_format: {
        type: 'json_object'
      },
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
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

  return JSON.parse(rawContent);
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
  const parsed = await requestGroqJson({
    systemPrompt:
      'You are an education operations analyst for an ARAL reading support program. Return only JSON with keys headline, summary, alerts, recommendations. alerts and recommendations must be arrays of at most 3 short strings each.',
    userPrompt: `Review this teacher workload data and identify overload risk, escalation pressure, and staffing priorities.\n\n${buildWorkloadPrompt(workloadAnalytics)}`,
    maxCompletionTokens: 700
  });
  if (!parsed) {
    return null;
  }

  return {
    headline: String(parsed.headline || 'Teacher workload overview'),
    summary: String(parsed.summary || ''),
    alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 3).map(String) : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map(String)
      : []
  };
}

function buildReadingInterventionPrompt(readingPayload) {
  const iripRows = Array.isArray(readingPayload.iripRows)
    ? readingPayload.iripRows.map((row) => ({
        week: row.week,
        skill: row.skill,
        status: row.status || 'empty',
        notes: truncateText(row.notes || '', 140)
      }))
    : [];

  return JSON.stringify(
    {
      learner: {
        studentName: readingPayload.studentName,
        gradeLevel: readingPayload.gradeLevel,
        period: readingPayload.period
      },
      oralReading: {
        passageTitle: readingPayload.passageTitle,
        readingSeconds: readingPayload.readingSeconds,
        wordRecognition: readingPayload.wordRecognition,
        wordRecognitionLevel: readingPayload.wrLevel,
        wpm: readingPayload.wpm,
        wpmLevel: readingPayload.wpmLevel,
        finalLevel: readingPayload.level,
        pronunciation: readingPayload.pronunciation,
        majorMiscueCount: readingPayload.majorMiscueCount,
        majorMiscues: readingPayload.majorMiscues,
        fluencyObservations: truncateText(readingPayload.fluencyObservations, 400),
        teacherRecommendations: truncateText(readingPayload.teacherRecommendations, 400),
        transcriptExcerpt: truncateText(readingPayload.transcript, 900)
      },
      irip: {
        hasSavedRecord: iripRows.length > 0,
        rows: iripRows
      }
    },
    null,
    2
  );
}

export async function generateReadingInterventionSuggestions(readingPayload) {
  const parsed = await requestGroqJson({
    systemPrompt:
      'You are a reading intervention specialist for the ARAL program. Return only JSON with keys headline, summary, risk_level, immediate_actions, weekly_plan, irip_connection. immediate_actions must be an array of 3 short strings. weekly_plan must be an array of 4 objects with keys week, focus, teacher_action, success_marker. Align the weekly plan to IRIP-style reading support and base it on the oral reading voice analysis.',
    userPrompt: `Create AI intervention suggestions from this learner reading analysis and saved IRIP context.\n\n${buildReadingInterventionPrompt(readingPayload)}`,
    maxCompletionTokens: 1100
  });
  if (!parsed) {
    return null;
  }

  return {
    headline: String(parsed.headline || 'AI Reading Intervention Plan'),
    summary: String(parsed.summary || ''),
    riskLevel: String(parsed.risk_level || 'Monitor'),
    immediateActions: Array.isArray(parsed.immediate_actions)
      ? parsed.immediate_actions.slice(0, 3).map(String)
      : [],
    weeklyPlan: Array.isArray(parsed.weekly_plan)
      ? parsed.weekly_plan.slice(0, 4).map((item, index) => ({
          week: Number(item?.week) || index + 1,
          focus: String(item?.focus || ''),
          teacherAction: String(item?.teacher_action || ''),
          successMarker: String(item?.success_marker || '')
        }))
      : [],
    iripConnection: String(parsed.irip_connection || '')
  };
}

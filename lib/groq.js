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

function buildAdminWorkloadFallback(workloadAnalytics) {
  const overloadedTeachers = Array.isArray(workloadAnalytics?.teacherLoads)
    ? workloadAnalytics.teacherLoads.filter((teacher) => teacher.overloadLevel === 'High')
    : [];
  const moderateTeachers = Array.isArray(workloadAnalytics?.teacherLoads)
    ? workloadAnalytics.teacherLoads.filter((teacher) => teacher.overloadLevel === 'Moderate')
    : [];
  const escalationLearners = Array.isArray(workloadAnalytics?.escalationLearners)
    ? workloadAnalytics.escalationLearners
    : [];

  const summaryParts = [];
  if (overloadedTeachers.length > 0) {
    summaryParts.push(`${overloadedTeachers.length} teacher(s) are already in the high-overload range.`);
  }
  if (moderateTeachers.length > 0) {
    summaryParts.push(`${moderateTeachers.length} teacher(s) are being watched for moderate overload.`);
  }
  if (escalationLearners.length > 0) {
    summaryParts.push(`${escalationLearners.length} learner(s) currently add escalation pressure.`);
  }

  return {
    headline: overloadedTeachers.length > 0 ? 'Manual workload brief generated' : 'Workload overview generated',
    summary:
      summaryParts.join(' ') ||
      'Current staffing signals do not show immediate overload pressure from the saved dashboard data.',
    alerts: [
      overloadedTeachers[0]
        ? `${overloadedTeachers[0].teacherName} needs immediate workload review.`
        : null,
      moderateTeachers[0]
        ? `${moderateTeachers[0].teacherName} should be monitored for rising workload demand.`
        : null,
      escalationLearners[0]
        ? `${escalationLearners[0].last_name}, ${escalationLearners[0].first_name} appears on the escalation watchlist.`
        : null
    ].filter(Boolean),
    recommendations: [
      overloadedTeachers.length > 0
        ? 'Rebalance intervention-heavy learners across available teachers this week.'
        : 'Keep reviewing teacher workload totals as new intervention records are saved.',
      escalationLearners.length > 0
        ? 'Prioritize follow-up on learners with multiple support signals before adding new cases.'
        : 'Maintain the current intervention schedule and continue weekly monitoring.',
      moderateTeachers.length > 0
        ? 'Check whether moderate-load teachers need timetable or section support before they escalate.'
        : 'Use the workload table to confirm sections remain evenly staffed.'
    ].filter(Boolean).slice(0, 3)
  };
}

function getReadingRiskLevel(readingPayload) {
  const finalLevel = String(readingPayload?.level || '');
  const wpmLevel = String(readingPayload?.wpmLevel || '');
  const wordRecognition = Number(readingPayload?.wordRecognition || 0);
  const majorMiscueCount = Number(readingPayload?.majorMiscueCount || 0);

  if (finalLevel === 'Frustration' || wpmLevel === 'Frustration' || wordRecognition < 90 || majorMiscueCount >= 6) {
    return 'High';
  }

  if (finalLevel === 'Instructional' || wpmLevel === 'Instructional' || majorMiscueCount >= 3) {
    return 'Moderate';
  }

  return 'Low';
}

function buildReadingInterventionFallback(readingPayload) {
  const riskLevel = getReadingRiskLevel(readingPayload);
  const finalLevel = String(readingPayload?.level || 'Instructional');
  const wpmLevel = String(readingPayload?.wpmLevel || 'Instructional');
  const majorMiscueCount = Number(readingPayload?.majorMiscueCount || 0);
  const learnerName = String(readingPayload?.studentName || 'This learner');
  const hasIripRows = Array.isArray(readingPayload?.iripRows) && readingPayload.iripRows.length > 0;

  const primaryFocus =
    majorMiscueCount >= 5
      ? 'word tracking and accuracy'
      : wpmLevel === 'Frustration'
        ? 'automaticity and guided rereading'
        : finalLevel === 'Independent'
          ? 'comprehension and expression'
          : 'decoding support and monitored oral reading';

  return {
    headline:
      riskLevel === 'High'
        ? 'Immediate guided reading support recommended'
        : riskLevel === 'Moderate'
          ? 'Targeted weekly reading support recommended'
          : 'Maintain progress with light reading follow-up',
    summary: `${learnerName} currently shows ${finalLevel.toLowerCase()} reading performance with ${primaryFocus} as the clearest next support target.`,
    riskLevel,
    immediateActions: [
      'Model the passage once, then let the learner reread it with immediate correction.',
      majorMiscueCount >= 5
        ? 'Track omitted and substituted content words using phrase-by-phrase reading.'
        : 'Highlight unfamiliar words before the next oral reading check.',
      wpmLevel === 'Frustration'
        ? 'Use a shorter repeated-reading drill to build pace without losing accuracy.'
        : 'Close the session with a short retell to confirm understanding.'
    ],
    weeklyPlan: [
      {
        week: 1,
        focus: 'Accuracy baseline',
        teacherAction: 'Reteach the passage in short chunks and mark repeated miscues during guided reading.',
        successMarker: 'Fewer repeated miscues on the same target words.'
      },
      {
        week: 2,
        focus: 'Word recognition',
        teacherAction: 'Drill high-frequency and content words from the passage before another oral reading.',
        successMarker: 'Learner reads target words correctly with less prompting.'
      },
      {
        week: 3,
        focus: wpmLevel === 'Frustration' ? 'Reading rate' : 'Fluency and phrasing',
        teacherAction: wpmLevel === 'Frustration'
          ? 'Run one-minute repeated readings on a shorter passage at instructional difficulty.'
          : 'Practice phrase-cued oral reading and brief expression checks.',
        successMarker: wpmLevel === 'Frustration'
          ? 'Words-per-minute improves without a rise in major miscues.'
          : 'Learner groups words more naturally and reads with steadier phrasing.'
      },
      {
        week: 4,
        focus: 'Transfer check',
        teacherAction: 'Reassess with a comparable passage and compare level, miscues, and pacing to week 1.',
        successMarker: 'Teacher can confirm whether the learner should stay on the same support level or move up.'
      }
    ],
    iripConnection: hasIripRows
      ? 'Align the next IRIP entries to the same miscues and weekly focus areas shown in this reading result.'
      : 'Create or update the learner IRIP checklist so the weekly reading actions are documented and tracked.'
  };
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
  try {
    const parsed = await requestGroqJson({
      systemPrompt:
        'You are an education operations analyst for an ARAL reading support program. Return only JSON with keys headline, summary, alerts, recommendations. alerts and recommendations must be arrays of at most 3 short strings each.',
      userPrompt: `Review this teacher workload data and identify overload risk, escalation pressure, and staffing priorities.\n\n${buildWorkloadPrompt(workloadAnalytics)}`,
      maxCompletionTokens: 700
    });
    if (!parsed) {
      return buildAdminWorkloadFallback(workloadAnalytics);
    }

    return {
      headline: String(parsed.headline || 'Teacher workload overview'),
      summary: String(parsed.summary || ''),
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 3).map(String) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 3).map(String)
        : []
    };
  } catch {
    return buildAdminWorkloadFallback(workloadAnalytics);
  }
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
  try {
    const parsed = await requestGroqJson({
      systemPrompt:
        'You are a reading intervention specialist for the ARAL program. Return only JSON with keys headline, summary, risk_level, immediate_actions, weekly_plan, irip_connection. immediate_actions must be an array of 3 short strings. weekly_plan must be an array of 4 objects with keys week, focus, teacher_action, success_marker. Align the weekly plan to IRIP-style reading support and base it on the oral reading voice analysis.',
      userPrompt: `Create AI intervention suggestions from this learner reading analysis and saved IRIP context.\n\n${buildReadingInterventionPrompt(readingPayload)}`,
      maxCompletionTokens: 1100
    });
    if (!parsed) {
      return buildReadingInterventionFallback(readingPayload);
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
  } catch {
    return buildReadingInterventionFallback(readingPayload);
  }
}

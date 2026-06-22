'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';

import { formatDateOnly, getCurrentDateValue } from '@/lib/date';
import SubmitButton from '@/components/SubmitButton';

const PASSAGES = [
  {
    id: 'g1_p1',
    title: 'Ang Aking Pamilya',
    grade: 1,
    text: 'Ang aking pamilya ay masaya. Kasama ko si Nanay, Tatay, at ang aking kapatid. Kami ay nagtutulungan sa bahay at nagdarasal bago matulog.'
  },
  {
    id: 'g2_p1',
    title: 'Ang Mahal Kong Nanay',
    grade: 2,
    text: 'Ang mahal kong nanay ay masipag at mapagmahal. Araw-araw ay inihahanda niya ang aming pagkain at tinutulungan niya ako sa aking aralin pagkatapos ng klase.'
  },
  {
    id: 'g3_p1',
    title: 'Ang Matandang Mangingisda',
    grade: 3,
    text: 'Maagang gumigising ang matandang mangingisda upang pumalaot sa dagat. Maingat niyang inihahagis ang lambat at buong tiyagang hinihintay ang huling ibibigay ng dagat.'
  },
  {
    id: 'g4_p1',
    title: 'Ang Kagandahan ng Kalikasan',
    grade: 4,
    text: 'Mahalagang pangalagaan ang kalikasan dahil dito nanggagaling ang malinis na hangin, tubig, at pagkain. Kapag nagtatanim tayo ng puno at nagtatapon nang tama, mas nagiging ligtas at malinis ang pamayanan.'
  },
  {
    id: 'g5_p1',
    title: 'Ang Pagtutulungan',
    grade: 5,
    text: 'Ang pagtutulungan ay mahalaga sa tahanan, paaralan, at pamayanan. Kapag ang bawat isa ay handang tumulong at makinig, mas mabilis natatapos ang gawain at mas nagiging maayos ang samahan ng lahat.'
  },
  {
    id: 'g6_p1',
    title: 'Ang Kabataang Pilipino',
    grade: 6,
    text: 'Ang kabataang Pilipino ay may mahalagang papel sa kinabukasan ng bansa. Sa pamamagitan ng sipag, disiplina, at malasakit sa kapwa, makatutulong sila sa pagbuo ng isang matatag at maunlad na lipunan.'
  }
];

const WPM_NORMS = {
  1: { independent: 70, instructionalLow: 31 },
  2: { independent: 100, instructionalLow: 61 },
  3: { independent: 120, instructionalLow: 91 },
  4: { independent: 140, instructionalLow: 111 },
  5: { independent: 170, instructionalLow: 141 },
  6: { independent: 190, instructionalLow: 161 }
};

const FUNCTION_WORDS = new Set([
  'ang', 'ng', 'na', 'sa', 'ay', 'at', 'mga', 'ni', 'kay', 'para', 'kung', 'nang',
  'dahil', 'pero', 'kaya', 'o', 'pa', 'din', 'rin', 'doon', 'dito', 'ito', 'iyon',
  'kami', 'siya', 'sila', 'namin', 'nila', 'niya', 'ko', 'mo', 'ka', 'ikaw', 'ako',
  'nito', 'noon', 'nga', 'man', 'lang', 'lamang', 'po', 'ho', 'si', 'angmga', 'mga',
  'saakin', 'akin', 'aming'
]);

function levelFromWpm(wpm, grade) {
  const norm = WPM_NORMS[grade];
  if (!norm) return 'Frustration';
  if (wpm >= norm.independent) return 'Independent';
  if (wpm >= norm.instructionalLow) return 'Instructional';
  return 'Frustration';
}

function levelFromWordRecognition(percent) {
  if (percent >= 97) return 'Independent';
  if (percent >= 90) return 'Instructional';
  return 'Frustration';
}

function finalLevel(wordRecognitionLevel, speedLevel) {
  if (wordRecognitionLevel === 'Frustration' || speedLevel === 'Frustration') return 'Frustration';
  if (wordRecognitionLevel === 'Independent' && speedLevel === 'Independent') return 'Independent';
  return 'Instructional';
}

function pronunciationFromRecognition(percent) {
  if (percent >= 97) return 'Proficient';
  if (percent >= 90) return 'Developing';
  return 'Needs Support';
}

function normalizeWord(word) {
  return String(word || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[-–—]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeForAnalysis(text) {
  const rawWords = String(text || '').match(/[^\s]+/g) || [];

  return rawWords
    .map((word, index) => {
      const normalized = normalizeWord(word);
      if (!normalized) return null;

      return {
        original: word.replace(/[.,/#!$%^&*;:{}=_`~()?"']/g, ''),
        normalized,
        position: index + 1,
        isFunction: FUNCTION_WORDS.has(normalized)
      };
    })
    .filter(Boolean);
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function isNearMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  if (Math.max(a.length, b.length) <= 3) return false;
  return similarityScore(a, b) >= 0.84;
}

function omissionPenalty(word) {
  return word.isFunction ? 0.35 : 1;
}

function insertionPenalty(word, previousTranscriptWord) {
  if (previousTranscriptWord && previousTranscriptWord.normalized === word.normalized) {
    return 0.2;
  }
  return word.isFunction ? 0.35 : 1;
}

function substitutionPenalty(passageWord, transcriptWord) {
  if (passageWord.isFunction || transcriptWord.isFunction) {
    return 0.35;
  }
  return 1;
}

function alignWords(passageWords, transcriptWords) {
  const m = passageWords.length;
  const n = transcriptWords.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const choice = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));

  for (let i = m - 1; i >= 0; i -= 1) {
    dp[i][n] = dp[i + 1][n] + omissionPenalty(passageWords[i]);
    choice[i][n] = 'omit';
  }

  for (let j = n - 1; j >= 0; j -= 1) {
    dp[m][j] = dp[m][j + 1] + insertionPenalty(transcriptWords[j], transcriptWords[j - 1]);
    choice[m][j] = 'insert';
  }

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      const passageWord = passageWords[i];
      const transcriptWord = transcriptWords[j];
      const equivalent = isNearMatch(passageWord.normalized, transcriptWord.normalized);

      const options = [
        {
          type: equivalent ? 'match' : 'substitute',
          cost:
            dp[i + 1][j + 1] +
            (equivalent ? 0 : substitutionPenalty(passageWord, transcriptWord))
        },
        {
          type: 'omit',
          cost: dp[i + 1][j] + omissionPenalty(passageWord)
        },
        {
          type: 'insert',
          cost: dp[i][j + 1] + insertionPenalty(transcriptWord, transcriptWords[j - 1])
        }
      ];

      options.sort((a, b) => a.cost - b.cost);
      dp[i][j] = options[0].cost;
      choice[i][j] = options[0].type;
    }
  }

  const operations = [];
  let i = 0;
  let j = 0;

  while (i < m || j < n) {
    const step = choice[i]?.[j];

    if (i < m && j < n && (step === 'match' || step === 'substitute')) {
      operations.push({
        type: step,
        passageWord: passageWords[i],
        transcriptWord: transcriptWords[j]
      });
      i += 1;
      j += 1;
      continue;
    }

    if (i < m && step === 'omit') {
      operations.push({
        type: 'omit',
        passageWord: passageWords[i]
      });
      i += 1;
      continue;
    }

    if (j < n && step === 'insert') {
      operations.push({
        type: 'insert',
        transcriptWord: transcriptWords[j],
        previousTranscriptWord: transcriptWords[j - 1] || null,
        currentPassageWord: passageWords[i] || null
      });
      j += 1;
      continue;
    }

    if (i < m && j < n) {
      operations.push({
        type: 'substitute',
        passageWord: passageWords[i],
        transcriptWord: transcriptWords[j]
      });
      i += 1;
      j += 1;
    } else if (i < m) {
      operations.push({
        type: 'omit',
        passageWord: passageWords[i]
      });
      i += 1;
    } else if (j < n) {
      operations.push({
        type: 'insert',
        transcriptWord: transcriptWords[j],
        previousTranscriptWord: transcriptWords[j - 1] || null,
        currentPassageWord: null
      });
      j += 1;
    }
  }

  return operations;
}

function buildFluencyObservations({ wpmLevel, majorCount, transcriptWords, totalWords }) {
  const coverage = totalWords > 0 ? Math.min(100, Math.round((transcriptWords / totalWords) * 100)) : 0;
  const paceText =
    wpmLevel === 'Independent'
      ? 'The learner maintained an independent oral reading pace for the selected grade.'
      : wpmLevel === 'Instructional'
        ? 'The learner sustained an instructional reading pace and may still need guided oral reading practice.'
        : 'The learner read below the expected oral reading pace and may benefit from shorter guided rereading.';

  const accuracyText =
    majorCount === 0
      ? 'No major miscues were detected in the transcript comparison.'
      : majorCount <= 3
        ? 'A small number of major miscues appeared during oral reading.'
        : 'Several major miscues were detected and affected word recognition stability.';

  return `${paceText} ${accuracyText} Transcript coverage reached about ${coverage}% of the target passage.`;
}

function buildTeacherRecommendations({ finalReadingLevel, majorMiscues, wpmLevel }) {
  const heavyOmissions = majorMiscues.filter((item) => item.type === 'omission').length;
  const heavySubstitutions = majorMiscues.filter((item) => item.type === 'substitution').length;

  const recommendations = [
    '1. Reassess the same passage after one guided modeled reading to confirm consistency of miscues.',
    heavyOmissions > heavySubstitutions
      ? '2. Focus practice on phrase-by-phrase tracking so the learner does not skip content words.'
      : '2. Focus practice on decoding and word attack strategies for unfamiliar content words.',
    wpmLevel === 'Frustration'
      ? '3. Use shorter repeated oral reading drills to build automaticity before moving to a harder text.'
      : '3. Continue monitored oral reading with immediate corrective feedback on miscues.',
    finalReadingLevel === 'Independent'
      ? '4. Transition to oral retell and expressive rereading tasks.'
      : '4. Keep the learner on instructional-level passages until miscues and pacing become more stable.'
  ];

  return recommendations.join(' ');
}

function analyzeReadingPerformance({ passageTitle, passageText, transcript, gradeLevel, readingSeconds, period }) {
  const passageWords = tokenizeForAnalysis(passageText);
  const transcriptWords = tokenizeForAnalysis(transcript);
  const totalWords = passageWords.length;
  const seconds = Number(readingSeconds || 0);

  if (!totalWords) {
    return {
      ready: false,
      totalWords: 0,
      readingSeconds: seconds,
      wpm: 0,
      wpmLevel: 'Frustration',
      wordRecognition: 0,
      wrLevel: 'Frustration',
      majorMiscues: [],
      minorMiscues: [],
      majorMiscueCount: 0,
      percentMiscues: 0,
      level: 'Frustration',
      pronunciation: 'Needs Support',
      fluencyObservations: '',
      teacherRecommendations: '',
      notes: ''
    };
  }

  if (!transcriptWords.length || seconds <= 0) {
    return {
      ready: false,
      totalWords,
      readingSeconds: seconds,
      wpm: seconds > 0 ? Math.round((totalWords / seconds) * 60) : 0,
      wpmLevel: levelFromWpm(seconds > 0 ? Math.round((totalWords / seconds) * 60) : 0, gradeLevel),
      wordRecognition: 100,
      wrLevel: 'Independent',
      majorMiscues: [],
      minorMiscues: [],
      majorMiscueCount: 0,
      percentMiscues: 0,
      level: levelFromWpm(seconds > 0 ? Math.round((totalWords / seconds) * 60) : 0, gradeLevel),
      pronunciation: 'Proficient',
      fluencyObservations: '',
      teacherRecommendations: '',
      notes: buildCompactNotes({
        passageTitle,
        period,
        totalWords,
        readingSeconds: seconds,
        majorMiscueCount: 0,
        wordRecognition: 100,
        wpm: seconds > 0 ? Math.round((totalWords / seconds) * 60) : 0,
        transcript,
        majorMiscues: []
      })
    };
  }

  const operations = alignWords(passageWords, transcriptWords);
  const majorMiscues = [];
  const minorMiscues = [];

  for (const operation of operations) {
    if (operation.type === 'match') {
      continue;
    }

    if (operation.type === 'substitute') {
      const { passageWord, transcriptWord } = operation;

      if (passageWord.isFunction || transcriptWord.isFunction) {
        minorMiscues.push({
          type: 'function-word-substitution',
          original: passageWord.original,
          readAs: transcriptWord.original,
          position: passageWord.position
        });
      } else {
        majorMiscues.push({
          type: 'substitution',
          original: passageWord.original,
          readAs: transcriptWord.original,
          position: passageWord.position
        });
      }
      continue;
    }

    if (operation.type === 'omit') {
      const { passageWord } = operation;
      if (passageWord.isFunction) {
        minorMiscues.push({
          type: 'function-word-omission',
          original: passageWord.original,
          readAs: '',
          position: passageWord.position
        });
      } else {
        majorMiscues.push({
          type: 'omission',
          original: passageWord.original,
          readAs: '',
          position: passageWord.position
        });
      }
      continue;
    }

    if (operation.type === 'insert') {
      const transcriptWord = operation.transcriptWord;
      const repeated =
        operation.previousTranscriptWord &&
        operation.previousTranscriptWord.normalized === transcriptWord.normalized;

      if (repeated) {
        minorMiscues.push({
          type: 'repetition',
          original: transcriptWord.original,
          readAs: transcriptWord.original,
          position: operation.currentPassageWord?.position || transcriptWord.position
        });
      } else if (transcriptWord.isFunction) {
        minorMiscues.push({
          type: 'hesitation',
          original: transcriptWord.original,
          readAs: transcriptWord.original,
          position: operation.currentPassageWord?.position || transcriptWord.position
        });
      } else {
        majorMiscues.push({
          type: 'insertion',
          original: operation.currentPassageWord?.original || '',
          readAs: transcriptWord.original,
          position: operation.currentPassageWord?.position || transcriptWord.position
        });
      }
    }
  }

  const majorMiscueCount = majorMiscues.length;
  const percentMiscues = totalWords > 0 ? (majorMiscueCount / totalWords) * 100 : 0;
  const wordRecognition = Math.max(0, 100 - percentMiscues);
  const wpm = seconds > 0 ? Math.round((totalWords / seconds) * 60) : 0;
  const wrLevel = levelFromWordRecognition(wordRecognition);
  const wpmLevel = levelFromWpm(wpm, gradeLevel);
  const level = finalLevel(wrLevel, wpmLevel);
  const pronunciation = pronunciationFromRecognition(wordRecognition);
  const fluencyObservations = buildFluencyObservations({
    wpmLevel,
    majorCount: majorMiscueCount,
    transcriptWords: transcriptWords.length,
    totalWords
  });
  const teacherRecommendations = buildTeacherRecommendations({
    finalReadingLevel: level,
    majorMiscues,
    wpmLevel
  });
  return {
    ready: true,
    totalWords,
    readingSeconds: seconds,
    wpm,
    wpmLevel,
    wordRecognition,
    wrLevel,
    majorMiscues,
    minorMiscues,
    majorMiscueCount,
    percentMiscues,
    level,
    pronunciation,
    fluencyObservations,
    teacherRecommendations,
    notes: buildCompactNotes({
      passageTitle,
      period,
      totalWords,
      readingSeconds: seconds,
      majorMiscueCount,
      wordRecognition,
      wpm,
      transcript,
      majorMiscues
    })
  };
}

function buildCompactNotes({
  passageTitle,
  period,
  totalWords,
  readingSeconds,
  majorMiscueCount,
  wordRecognition,
  wpm,
  transcript,
  majorMiscues
}) {
  const sampleMiscues = majorMiscues
    .slice(0, 5)
    .map((miscue) => `${miscue.position}:${miscue.original || '-'}>${miscue.readAs || '-'}`)
    .join(', ');

  return [
    `Passage: ${passageTitle}`,
    `Period: ${period}`,
    `Words: ${totalWords}`,
    `Reading Seconds: ${readingSeconds}`,
    `Major Miscues: ${majorMiscueCount}`,
    `Word Recognition: ${wordRecognition.toFixed(2)}%`,
    `WPM: ${wpm}`,
    sampleMiscues ? `Major Miscue Samples: ${sampleMiscues}` : null,
    transcript ? `Transcript: ${transcript}` : null
  ]
    .filter(Boolean)
    .join(' | ');
}

function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function levelClassName(level) {
  if (level === 'Independent') return 'green';
  if (level === 'Instructional') return 'amber';
  return 'red';
}

function getLearnerInitials(firstName, lastName) {
  return `${String(firstName || '').trim().charAt(0)}${String(lastName || '').trim().charAt(0)}`
    .replace(/\s+/g, '')
    .toUpperCase() || 'LR';
}

function getAssessmentTimestamp(assessment) {
  const value = assessment?.assessed_date;
  if (!value) return 0;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Date.parse(`${value}T12:00:00Z`) || 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function parseAssessmentNotes(notes) {
  const details = {
    passage: '',
    period: '',
    words: '',
    readingSeconds: '',
    majorMiscues: '',
    wordRecognition: '',
    wpm: '',
    majorMiscueSamples: '',
    transcript: ''
  };

  String(notes || '')
    .split(' | ')
    .forEach((part) => {
      const separatorIndex = part.indexOf(': ');
      if (separatorIndex === -1) {
        return;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 2).trim();

      if (key === 'Passage') details.passage = value;
      if (key === 'Period') details.period = value;
      if (key === 'Words') details.words = value;
      if (key === 'Reading Seconds') details.readingSeconds = value;
      if (key === 'Major Miscues') details.majorMiscues = value;
      if (key === 'Word Recognition') details.wordRecognition = value;
      if (key === 'WPM') details.wpm = value;
      if (key === 'Major Miscue Samples') details.majorMiscueSamples = value;
      if (key === 'Transcript') details.transcript = value;
    });

  return details;
}

function shortenText(value, maxLength = 220) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function ReadingTracker({ students, assessments, action, saveComprehensionAction }) {
  const [state, formAction] = useActionState(action, {});
  const [selectedPassageId, setSelectedPassageId] = useState(PASSAGES[0].id);
  const [customPassage, setCustomPassage] = useState('');
  const [gradeLevel, setGradeLevel] = useState(1);
  const [period, setPeriod] = useState('Pre-test');
  const [readingSeconds, setReadingSeconds] = useState('');
  const [studentId, setStudentId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('Mic is ready.');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [compQuestions, setCompQuestions] = useState(5);
  const [compCorrect, setCompCorrect] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiSuggestionsStatus, setAiSuggestionsStatus] = useState('idle');
  const [aiSuggestionsError, setAiSuggestionsError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('overview');
  const [selectedHistoryStudentId, setSelectedHistoryStudentId] = useState('');

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordingStartRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const recordingFlagRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioAnimRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);

  const passage = useMemo(() => {
    if (selectedPassageId === 'custom') {
      return {
        title: 'Custom Passage',
        text: customPassage
      };
    }

    return PASSAGES.find((item) => item.id === selectedPassageId) || PASSAGES[0];
  }, [customPassage, selectedPassageId]);

  const totalWords = useMemo(() => tokenizeForAnalysis(passage.text).length, [passage.text]);
  const studentLookup = useMemo(() => {
    const lookup = new Map();
    students.forEach((student) => {
      lookup.set(String(student.id), student);
    });
    return lookup;
  }, [students]);
  const selectedStudent = studentLookup.get(String(studentId)) || null;

  const analysis = useMemo(
    () =>
      analyzeReadingPerformance({
        passageTitle: passage.title,
        passageText: passage.text,
        transcript,
        gradeLevel,
        readingSeconds: Number(readingSeconds || 0),
        period
      }),
    [gradeLevel, passage.text, passage.title, period, readingSeconds, transcript]
  );

  const compNum = Number(compCorrect);
  const compScore = compQuestions > 0 && compCorrect !== '' && compNum >= 0
    ? Math.round((compNum / compQuestions) * 100)
    : null;
  const compLevel = compScore !== null
    ? compScore >= 88 ? 'Independent' : compScore >= 63 ? 'Instructional' : 'Frustration'
    : null;

  const historyGroups = useMemo(() => {
    const groups = new Map();

    assessments.forEach((assessment) => {
      const studentKey = String(assessment.student_id);
      const currentGroup = groups.get(studentKey) || {
        studentId: studentKey,
        studentName: `${assessment.last_name}, ${assessment.first_name}`,
        firstName: assessment.first_name,
        lastName: assessment.last_name,
        assessments: []
      };

      currentGroup.assessments.push(assessment);
      groups.set(studentKey, currentGroup);
    });

    return Array.from(groups.values())
      .map((group) => {
        const sortedAssessments = [...group.assessments].sort((left, right) => {
          const timestampDelta = getAssessmentTimestamp(right) - getAssessmentTimestamp(left);
          if (timestampDelta !== 0) return timestampDelta;
          return Number(right.id || 0) - Number(left.id || 0);
        });

        return {
          ...group,
          assessments: sortedAssessments,
          latestAssessment: sortedAssessments[0]
        };
      })
      .sort((left, right) => {
        const timestampDelta =
          getAssessmentTimestamp(right.latestAssessment) - getAssessmentTimestamp(left.latestAssessment);
        if (timestampDelta !== 0) return timestampDelta;
        return left.studentName.localeCompare(right.studentName);
      });
  }, [assessments]);

  const selectedHistoryGroup =
    historyGroups.find((group) => group.studentId === String(selectedHistoryStudentId)) || historyGroups[0] || null;

  useEffect(() => {
    setAiSuggestions(null);
    setAiSuggestionsStatus('idle');
    setAiSuggestionsError('');
  }, [studentId, transcript, readingSeconds, selectedPassageId, customPassage, gradeLevel, period]);

  useEffect(() => {
    if (!historyGroups.length) {
      setSelectedHistoryStudentId('');
      return;
    }

    if (!historyGroups.some((group) => group.studentId === String(selectedHistoryStudentId))) {
      setSelectedHistoryStudentId(historyGroups[0].studentId);
    }
  }, [historyGroups, selectedHistoryStudentId]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));

    return () => {
      recordingFlagRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopAudioLevelMeter();
    };
  }, []);

  useEffect(() => {
    if (selectedPassageId !== 'custom') {
      const matchedPassage = PASSAGES.find((item) => item.id === selectedPassageId);
      if (matchedPassage?.grade) {
        setGradeLevel(matchedPassage.grade);
      }
    }
  }, [selectedPassageId]);

  function startTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    recordingStartRef.current = Date.now() - elapsedSecondsRef.current * 1000;
    timerIntervalRef.current = setInterval(() => {
      const nextSeconds = (Date.now() - recordingStartRef.current) / 1000;
      elapsedSecondsRef.current = nextSeconds;
      setReadingSeconds(String(Math.max(1, Math.round(nextSeconds))));
    }, 250);
  }

  function stopTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function stopAudioLevelMeter() {
    if (audioAnimRef.current) {
      cancelAnimationFrame(audioAnimRef.current);
      audioAnimRef.current = null;
    }
    setAudioLevel(0);
    setMicActive(false);
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch (_) { /* ignore cleanup errors */ }
    audioContextRef.current = null;
    analyserRef.current = null;
    audioDataRef.current = null;
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }

  function startAudioLevelMeter() {
    stopAudioLevelMeter();
    try {
      const stream = navigator.mediaDevices.getUserMedia({ audio: true });
      stream.then((s) => {
        audioStreamRef.current = s;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(s);
        audioSourceRef.current = source;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        audioDataRef.current = data;

        function tick() {
          if (!analyserRef.current || !audioDataRef.current) return;
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          const avg = Array.from(audioDataRef.current).reduce((a, b) => a + b, 0) / audioDataRef.current.length;
          const level = Math.min(100, Math.round((avg / 255) * 100));
          setAudioLevel(level);
          setMicActive(level > 2);
          audioAnimRef.current = requestAnimationFrame(tick);
        }

        tick();
      }).catch(() => {
        setMicActive(false);
      });
    } catch (_) { /* ignore */ }
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus('Speech recognition is only available in supported Chrome or Edge browsers.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fil-PH';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      recordingFlagRef.current = true;
      setSpeechStatus('Recording in progress. Let the learner read the full passage.');
      startTimer();
      startAudioLevelMeter();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalized = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalized += `${chunk} `;
        } else {
          interim += chunk;
        }
      }

      if (finalized) {
        setTranscript((current) => `${current}${current ? ' ' : ''}${finalized.trim()}`.trim());
      }
      setLiveTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setSpeechStatus(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (recordingFlagRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    setIsRecording(false);
    recordingFlagRef.current = false;
    setLiveTranscript('');
    stopTimer();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    stopAudioLevelMeter();

    const elapsed = Math.max(1, Math.round(elapsedSecondsRef.current));
    if (elapsed) {
      setReadingSeconds(String(elapsed));
    }
    setSpeechStatus(`Recording paused at ${formatTimer(elapsed)}.`);
  }

  function toggleRecording() {
    if (!speechSupported) {
      setSpeechStatus('Speech recognition is only available in supported Chrome or Edge browsers.');
      return;
    }

    if (!studentId) {
      setSpeechStatus('Select a student before starting the mic.');
      return;
    }

    if (!passage.text.trim()) {
      setSpeechStatus('Enter or select a reading passage before using the mic.');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function resetVoiceSession() {
    if (isRecording) {
      stopRecording();
    }

    recordingFlagRef.current = false;
    elapsedSecondsRef.current = 0;
    setReadingSeconds('');
    setTranscript('');
    setLiveTranscript('');
    setSpeechStatus('Voice session cleared.');
  }

  async function generateAiSuggestions() {
    if (!selectedStudent) {
      setAiSuggestionsError('Select a student first.');
      setAiSuggestionsStatus('error');
      return;
    }

    if (!analysis.ready || !transcript.trim()) {
      setAiSuggestionsError('Record or paste a voice transcript first.');
      setAiSuggestionsStatus('error');
      return;
    }

    setAiSuggestionsStatus('loading');
    setAiSuggestionsError('');

    try {
      const response = await fetch('/api/teacher/reading-interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentName: `${selectedStudent.last_name}, ${selectedStudent.first_name}`,
          gradeLevel,
          period,
          passageTitle: passage.title,
          transcript,
          readingSeconds: analysis.readingSeconds,
          wordRecognition: Number(analysis.wordRecognition.toFixed(2)),
          wrLevel: analysis.wrLevel,
          wpm: analysis.wpm,
          wpmLevel: analysis.wpmLevel,
          level: analysis.level,
          pronunciation: analysis.pronunciation,
          majorMiscueCount: analysis.majorMiscueCount,
          majorMiscues: analysis.majorMiscues.slice(0, 6),
          fluencyObservations: analysis.fluencyObservations,
          teacherRecommendations: analysis.teacherRecommendations
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to generate AI intervention suggestions.');
      }

      setAiSuggestions(payload);
      setAiSuggestionsStatus('ready');
    } catch (error) {
      setAiSuggestions(null);
      setAiSuggestionsError(error.message || 'Unable to generate AI intervention suggestions.');
      setAiSuggestionsStatus('error');
    }
  }

  const displayedTranscript = [transcript, liveTranscript].filter(Boolean).join(' ');
  const selectedStudentLabel = selectedStudent
    ? `${selectedStudent.last_name}, ${selectedStudent.first_name}`
    : 'Select a learner';
  const selectedStudentMeta = selectedStudent
    ? `Grade ${gradeLevel} · ${period} · ${passage.title}`
    : 'Choose a student, then record or paste a reading sample to generate results.';

  return (
    <section className="table-card reading-shell">
      <div className="reading-page-header">
        <div>
          <h2>Reading Tracker</h2>
          <p className="lead" style={{ margin: 0 }}>
            Capture oral reading, review the result in one focused panel, and open saved learner records from cards.
          </p>
        </div>
      </div>

      <div className="reading-grid">
        <div className="panel reading-form-panel">
          <div className="reading-panel-copy">
            <h3>Assessment Setup</h3>
            <p className="lead" style={{ margin: 0 }}>
              Select the learner, choose the passage, then use the mic or paste the transcript.
            </p>
          </div>
          <form action={formAction} className="form-grid">
            {state?.error ? <div className="banner error">{state.error}</div> : null}
            {state?.success ? <div className="banner success">{state.success}</div> : null}

            <div className="field">
              <label>Student</label>
              <select name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.last_name}, {student.first_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="two-col">
              <div className="field">
                <label>Grade Level</label>
                <select
                  name="gradeLevel"
                  value={gradeLevel}
                  onChange={(event) => setGradeLevel(Number(event.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Period</label>
                <select name="period" value={period} onChange={(event) => setPeriod(event.target.value)}>
                  <option>Pre-test</option>
                  <option>Post-test</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Passage</label>
              <select value={selectedPassageId} onChange={(event) => setSelectedPassageId(event.target.value)}>
                {PASSAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (Grade {item.grade})
                  </option>
                ))}
                <option value="custom">Custom Passage</option>
              </select>
            </div>

            {selectedPassageId === 'custom' ? (
              <div className="field">
                <label>Custom Passage</label>
                <textarea
                  value={customPassage}
                  onChange={(event) => setCustomPassage(event.target.value)}
                  placeholder="Paste or type the reading passage here."
                />
              </div>
            ) : null}

            <div className="two-col">
              <div className="field">
                <label>Total Words</label>
                <input value={totalWords} readOnly />
              </div>
              <div className="field">
                <label>Assessed Date</label>
                <input type="date" name="assessedDate" defaultValue={getCurrentDateValue()} />
              </div>
            </div>

            <div className="field">
              <label>Transcript</label>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Use the mic or paste the reading transcript."
              />
            </div>

            <div className="voice-controls">
              <button
                type="button"
                className={`button ${isRecording ? 'voice-recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button type="button" className="button-secondary" onClick={resetVoiceSession}>
                Reset Voice
              </button>
            </div>

            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 70 }}>
                  {micActive ? 'Mic Active' : 'No Sound'}
                </span>
                <div style={{
                  flex: 1, height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${audioLevel}%`,
                    height: '100%',
                    borderRadius: 4,
                    background: audioLevel > 60 ? '#ef4444' : audioLevel > 25 ? '#f59e0b' : '#22c55e',
                    transition: 'width 0.1s ease'
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>
                  {audioLevel}
                </span>
              </div>
            )}

            <div className="voice-status">
              <span className={`pill ${speechSupported ? 'green' : 'amber'}`}>
                {speechSupported ? 'Mic Supported' : 'Mic Limited'}
              </span>
              <span className="subtle">{speechStatus}</span>
            </div>

            <div className="two-col">
              <div className="field">
                <label>Reading Seconds</label>
                <input
                  type="number"
                  min="1"
                  value={readingSeconds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReadingSeconds(value);
                    elapsedSecondsRef.current = Number(value || 0);
                  }}
                />
              </div>
              <div className="field">
                <label>Major Miscues</label>
                <input value={analysis.majorMiscueCount} readOnly />
              </div>
            </div>

            <div className="field">
              <label>Pronunciation</label>
              <input name="pronunciation" value={analysis.pronunciation} readOnly />
            </div>

            <fieldset className="panel" style={{ gridColumn: '1 / -1', padding: 12 }}>
              <div className="nav-strip" style={{ marginBottom: 8 }}>
                <div>
                  <strong style={{ marginBottom: 4 }}>Phil-IRI Comprehension</strong>
                  <p className="lead" style={{ margin: 0 }}>Record comprehension questions and correct answers after oral reading.</p>
                </div>
                {compLevel ? (
                  <span className={`pill ${compLevel === 'Independent' ? 'green' : compLevel === 'Instructional' ? 'amber' : 'red'}`}>
                    {compLevel}
                  </span>
                ) : null}
              </div>
              <div className="two-col">
                <div className="field">
                  <label>Total Questions</label>
                  <select value={compQuestions} onChange={(e) => { setCompQuestions(Number(e.target.value)); setCompCorrect(''); }}>
                    {[5, 6, 7, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Correct Answers</label>
                  <input type="number" min={0} max={compQuestions} value={compCorrect} onChange={(e) => setCompCorrect(e.target.value)} />
                </div>
              </div>
              {compScore !== null ? (
                <div className="field">
                  <label>Comprehension Result</label>
                  <div>
                    <strong>{compNum}/{compQuestions}</strong>
                    <span style={{ margin: '0 8px' }}>&rarr;</span>
                    <strong>{compScore}%</strong>
                    <span style={{ marginLeft: 8 }}>
                      <span className={`pill ${compLevel === 'Independent' ? 'green' : compLevel === 'Instructional' ? 'amber' : 'red'}`}>{compLevel}</span>
                    </span>
                  </div>
                </div>
              ) : null}
            </fieldset>

            <input type="hidden" name="level" value={analysis.level} />
            <input type="hidden" name="notes" value={analysis.notes} />
            <input type="hidden" name="comprehensionPct" value={compScore || 0} />

            <SubmitButton>Save Reading Assessment</SubmitButton>
          </form>
        </div>

        <div className="panel reading-results-panel">
          <div className="nav-strip reading-results-head">
            <div>
              <h3 style={{ marginBottom: 8 }}>Oral Reading Result</h3>
              <p className="lead" style={{ margin: 0 }}>
                Review the live result, switch panels only when needed, and keep the main score summary visible.
              </p>
            </div>
            <div className="reading-live-timer">
              <strong>{formatTimer(Number(readingSeconds || 0))}</strong>
              <span className="subtle">Reading Time</span>
            </div>
          </div>

          <div className="reading-student-hero">
            <div className="reading-student-identity">
              <span className="reading-student-avatar">
                {selectedStudent
                  ? getLearnerInitials(selectedStudent.first_name, selectedStudent.last_name)
                  : 'AR'}
              </span>
              <div className="reading-student-copy">
                <strong>{selectedStudentLabel}</strong>
                <span className="subtle">{selectedStudentMeta}</span>
              </div>
            </div>
            <span className={`pill ${analysis.ready ? levelClassName(analysis.level) : 'amber'}`}>
              {analysis.ready ? `${analysis.level} Level` : 'Awaiting Sample'}
            </span>
          </div>

          <div className="reading-focus-grid">
            <div className="reading-section-block">
              <div className="reading-section-head">
                <strong>Selected Passage</strong>
                <span className="subtle">{passage.title}</span>
              </div>
              <div className="reading-passage">{passage.text || 'Enter a custom passage to begin.'}</div>
            </div>

            <div className="reading-section-block">
              <div className="reading-section-head">
                <strong>Voice Transcript</strong>
                <span className="subtle">
                  {displayedTranscript
                    ? 'Live speech capture and pasted text appear here.'
                    : 'Waiting for the learner reading sample.'}
                </span>
              </div>
              <div className="reading-transcript-box">
                {displayedTranscript || 'Speech will appear here while the learner is reading.'}
              </div>
            </div>
          </div>

          <div className="reading-score-grid">
            <div className="metric-card reading-metric-card">
              <h3>WR%</h3>
              <strong>{analysis.wordRecognition.toFixed(1)}%</strong>
              <span>{analysis.wrLevel}</span>
            </div>
            <div className="metric-card reading-metric-card">
              <h3>WPM</h3>
              <strong>{analysis.wpm || 0}</strong>
              <span>{analysis.wpmLevel}</span>
            </div>
            <div className="metric-card reading-metric-card">
              <h3>Miscues</h3>
              <strong>{analysis.majorMiscueCount}</strong>
              <span>Major Only</span>
            </div>
            <div className="metric-card reading-metric-card">
              <h3>Level</h3>
              <strong>{analysis.level}</strong>
              <span>{analysis.pronunciation}</span>
            </div>
          </div>

          <div className="reading-result-tabs" role="tablist" aria-label="Reading result panels">
            <button
              type="button"
              className={`reading-result-tab ${activeResultTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveResultTab('overview')}
            >
              Summary
            </button>
            <button
              type="button"
              className={`reading-result-tab ${activeResultTab === 'miscues' ? 'active' : ''}`}
              onClick={() => setActiveResultTab('miscues')}
            >
              Miscues
            </button>
            <button
              type="button"
              className={`reading-result-tab ${activeResultTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveResultTab('ai')}
            >
              AI Plan
            </button>
          </div>

          <div className="reading-result-stage">
            {activeResultTab === 'overview' ? (
              <>
                <div className="computation-box">
                  <div className="comp-title">Computation</div>
                  <div className="comp-line"><span>Total Words</span><span>{analysis.totalWords}</span></div>
                  <div className="comp-line"><span>% Miscues</span><span>{analysis.percentMiscues.toFixed(2)}%</span></div>
                  <div className="comp-line"><span>Word Recognition</span><span>{analysis.wordRecognition.toFixed(2)}%</span></div>
                  <div className="comp-line"><span>WPM</span><span>{analysis.wpm}</span></div>
                  <div className="comp-line"><span>Final Level</span><span>{analysis.level}</span></div>
                </div>

                <div className="reading-insight-grid">
                  <div className="panel reading-feedback-panel">
                    <h3>Fluency Snapshot</h3>
                    <p className="subtle" style={{ margin: 0 }}>
                      {analysis.ready
                        ? analysis.fluencyObservations
                        : 'Record reading to unlock the live fluency summary.'}
                    </p>
                  </div>
                  <div className="panel reading-feedback-panel">
                    <h3>Teacher Next Step</h3>
                    <p className="subtle" style={{ margin: 0 }}>
                      {analysis.ready
                        ? analysis.teacherRecommendations
                        : 'Voice analysis will place the clearest teacher next step here.'}
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            {activeResultTab === 'miscues' ? (
              <div className="reading-detail-grid reading-detail-grid-inline">
                <div className="panel reading-feedback-panel">
                  <h3>Major Miscues</h3>
                  {analysis.majorMiscues.length === 0 ? (
                    <div className="subtle">No major miscues detected yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Expected</th>
                            <th>Student Read</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.majorMiscues.map((miscue) => (
                            <tr key={`${miscue.position}-${miscue.type}-${miscue.original}-${miscue.readAs}`}>
                              <td>{miscue.position}</td>
                              <td>{miscue.original || '-'}</td>
                              <td>{miscue.readAs || 'Omitted'}</td>
                              <td><span className={`pill ${levelClassName('Frustration')}`}>{miscue.type}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="panel reading-feedback-panel">
                  <h3>Minor Miscues</h3>
                  {analysis.minorMiscues.length === 0 ? (
                    <div className="subtle">No minor miscues detected yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Word</th>
                            <th>Observed</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.minorMiscues.map((miscue) => (
                            <tr key={`${miscue.position}-${miscue.type}-${miscue.original}-${miscue.readAs}`}>
                              <td>{miscue.position}</td>
                              <td>{miscue.original || '-'}</td>
                              <td>{miscue.readAs || '-'}</td>
                              <td><span className={`pill ${levelClassName('Instructional')}`}>{miscue.type}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeResultTab === 'ai' ? (
              <div className="panel reading-feedback-panel">
                <div className="nav-strip" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ marginBottom: 8 }}>AI Intervention Suggestions</h3>
                    <p className="lead" style={{ margin: 0 }}>
                      Generate a weekly support plan based on the live reading result and saved IRIP context.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={generateAiSuggestions}
                    disabled={!analysis.ready || aiSuggestionsStatus === 'loading'}
                  >
                    {aiSuggestionsStatus === 'loading' ? 'Generating...' : 'Generate AI Suggestions'}
                  </button>
                </div>

                {aiSuggestionsStatus === 'error' ? (
                  <div className="banner error" style={{ marginBottom: 0 }}>{aiSuggestionsError}</div>
                ) : aiSuggestionsStatus === 'loading' ? (
                  <div className="subtle">Preparing intervention suggestions from the reading result...</div>
                ) : aiSuggestions ? (
                  <div className="page-grid" style={{ gap: 14 }}>
                    <div className="inline-actions" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong>{aiSuggestions.headline}</strong>
                        <p className="lead" style={{ marginTop: 8, marginBottom: 0 }}>{aiSuggestions.summary}</p>
                      </div>
                      <span className={`pill ${aiSuggestions.riskLevel === 'High' ? 'red' : aiSuggestions.riskLevel === 'Moderate' ? 'amber' : 'green'}`}>
                        {aiSuggestions.riskLevel}
                      </span>
                    </div>

                    <div>
                      <strong>Immediate Actions</strong>
                      <div className="page-grid" style={{ gap: 8, marginTop: 8 }}>
                        {aiSuggestions.immediateActions.map((item) => (
                          <div key={item} className="subtle">{item}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>Weekly Plan</strong>
                      <div className="reading-ai-week-grid" style={{ marginTop: 10 }}>
                        {aiSuggestions.weeklyPlan.map((item) => (
                          <div key={`${item.week}-${item.focus}`} className="reading-ai-week-card">
                            <span className="irip-week-badge">{item.week}</span>
                            <strong>{item.focus}</strong>
                            <div className="subtle">{item.teacherAction}</div>
                            <div className="subtle">Success marker: {item.successMarker}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="subtle">Generate suggestions after the learner finishes the voice reading.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="panel reading-history-panel">
        <div className="nav-strip reading-history-head">
          <div>
            <h3 style={{ marginBottom: 8 }}>Saved Reading Results</h3>
            <p className="lead" style={{ margin: 0 }}>
              Open a learner card to review saved sessions without scanning a long table.
            </p>
          </div>
          <span className="pill green">{historyGroups.length} Learners</span>
        </div>

        {historyGroups.length === 0 ? (
          <div className="subtle">No reading assessments saved yet.</div>
        ) : (
          <div className="reading-history-layout">
            <div className="reading-history-list">
              {historyGroups.map((group) => (
                <button
                  key={group.studentId}
                  type="button"
                  className={`reading-history-card ${selectedHistoryGroup?.studentId === group.studentId ? 'active' : ''}`}
                  onClick={() => setSelectedHistoryStudentId(group.studentId)}
                >
                  <div className="reading-history-card-head">
                    <span className="reading-history-avatar">
                      {getLearnerInitials(group.firstName, group.lastName)}
                    </span>
                    <div className="reading-history-card-copy">
                      <strong>{group.studentName}</strong>
                      <span className="subtle">
                        Latest: {formatDateOnly(group.latestAssessment?.assessed_date)}
                      </span>
                    </div>
                  </div>
                  <div className="reading-history-card-meta">
                    <span className={`pill ${levelClassName(group.latestAssessment?.level)}`}>
                      {group.latestAssessment?.level || 'No Level'}
                    </span>
                    <span className="subtle">{group.assessments.length} saved result(s)</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="reading-history-detail">
              <div className="reading-history-detail-head">
                <div>
                  <h3 style={{ marginBottom: 8 }}>{selectedHistoryGroup?.studentName}</h3>
                  <p className="lead" style={{ margin: 0 }}>
                    {selectedHistoryGroup ? `${selectedHistoryGroup.assessments.length} saved reading session(s)` : 'Select a learner card.'}
                  </p>
                </div>
              </div>

              <div className="reading-history-session-list">
                {selectedHistoryGroup?.assessments.map((assessment) => {
                  const noteDetails = parseAssessmentNotes(assessment.notes);

                  return (
                    <article key={assessment.id} className="reading-history-session-card">
                      <div className="reading-history-session-top">
                        <div>
                          <strong>{formatDateOnly(assessment.assessed_date)}</strong>
                          <div className="subtle">
                            {[noteDetails.passage, noteDetails.period].filter(Boolean).join(' · ') || 'Saved reading session'}
                          </div>
                        </div>
                        <div className="reading-history-session-badges">
                          <span className={`pill ${levelClassName(assessment.level)}`}>{assessment.level}</span>
                          <span className="pill amber">{assessment.pronunciation}</span>
                          {assessment.comprehension_pct !== null && assessment.comprehension_pct !== undefined ? (
                            <span className={`pill ${assessment.comprehension_pct >= 88 ? 'green' : assessment.comprehension_pct >= 63 ? 'amber' : 'red'}`}>
                              Comp: {assessment.comprehension_pct}%
                            </span>
                          ) : null}
                        </div>
                      </div>

                        <div className="reading-history-stat-grid">
                          <div className="reading-history-stat">
                            <span className="subtle">Word Recognition</span>
                            <strong>{noteDetails.wordRecognition || '-'}</strong>
                          </div>
                          <div className="reading-history-stat">
                            <span className="subtle">WPM</span>
                            <strong>{noteDetails.wpm || '-'}</strong>
                          </div>
                          <div className="reading-history-stat">
                            <span className="subtle">Reading Seconds</span>
                            <strong>{noteDetails.readingSeconds || '-'}</strong>
                          </div>
                          <div className="reading-history-stat">
                            <span className="subtle">Major Miscues</span>
                            <strong>{noteDetails.majorMiscues || '-'}</strong>
                          </div>
                          <div className="reading-history-stat">
                            <span className="subtle">Comprehension</span>
                            <strong>{assessment.comprehension_pct !== null && assessment.comprehension_pct !== undefined ? `${assessment.comprehension_pct}%` : '-'}</strong>
                          </div>
                        </div>

                      {noteDetails.majorMiscueSamples ? (
                        <div className="reading-history-note">
                          <strong>Major Miscue Samples</strong>
                          <div className="subtle">{noteDetails.majorMiscueSamples}</div>
                        </div>
                      ) : null}

                      {noteDetails.transcript ? (
                        <div className="reading-history-note transcript">
                          <strong>Transcript Preview</strong>
                          <div className="subtle">{shortenText(noteDetails.transcript, 320)}</div>
                        </div>
                      ) : assessment.notes ? (
                        <div className="reading-history-note">
                          <strong>Saved Note</strong>
                          <div className="subtle">{shortenText(assessment.notes, 320)}</div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

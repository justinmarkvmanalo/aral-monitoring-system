'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';

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
      ? '4. Transition to comprehension questioning and expressive reading tasks.'
      : '4. Keep the learner on instructional-level passages until miscues and pacing become more stable.'
  ];

  return recommendations.join(' ');
}

function buildComprehensionNote(comprehensionPct) {
  if (!Number.isFinite(comprehensionPct) || comprehensionPct <= 0) {
    return 'Comprehension has not been encoded yet. The oral reading level shown here is based on word recognition and reading speed only.';
  }
  if (comprehensionPct >= 75) {
    return 'Encoded comprehension is relatively strong, so follow-up should focus on maintaining accuracy and fluent oral reading.';
  }
  if (comprehensionPct >= 50) {
    return 'Encoded comprehension is partial. Guided retelling and teacher questioning are recommended after oral reading.';
  }
  return 'Encoded comprehension is low. The learner likely needs explicit support with both oral reading and meaning-making after reading.';
}

function analyzeReadingPerformance({ passageTitle, passageText, transcript, gradeLevel, readingSeconds, comprehensionPct, period }) {
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
      comprehensionNote: '',
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
      comprehensionNote: buildComprehensionNote(Number(comprehensionPct || 0)),
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
  const comprehensionNote = buildComprehensionNote(Number(comprehensionPct || 0));

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
    comprehensionNote,
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

export default function ReadingTracker({ students, assessments, action }) {
  const [state, formAction] = useActionState(action, {});
  const [selectedPassageId, setSelectedPassageId] = useState(PASSAGES[0].id);
  const [customPassage, setCustomPassage] = useState('');
  const [gradeLevel, setGradeLevel] = useState(1);
  const [period, setPeriod] = useState('Pre-test');
  const [readingSeconds, setReadingSeconds] = useState('');
  const [comprehensionPct, setComprehensionPct] = useState('');
  const [studentId, setStudentId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('Mic is ready.');
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordingStartRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const recordingFlagRef = useRef(false);

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

  const analysis = useMemo(
    () =>
      analyzeReadingPerformance({
        passageTitle: passage.title,
        passageText: passage.text,
        transcript,
        gradeLevel,
        readingSeconds: Number(readingSeconds || 0),
        comprehensionPct: Number(comprehensionPct || 0),
        period
      }),
    [comprehensionPct, gradeLevel, passage.text, passage.title, period, readingSeconds, transcript]
  );

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

  const displayedTranscript = [transcript, liveTranscript].filter(Boolean).join(' ');

  return (
    <section className="table-card">
      <h2>Reading Tracker</h2>
      <p className="lead">
        The voice assessor is now integrated into the app. It listens through the browser microphone,
        builds a transcript, checks miscues locally against the passage, and computes Phil-IRI oral
        reading results without depending on the old PHP flow.
      </p>

      <div className="panel reading-legend">
        <div className="three-col">
          <div>
            <h3>Word Recognition</h3>
            <p className="lead">Independent: 97-100% | Instructional: 90-96% | Frustration: 89% and below</p>
          </div>
          <div>
            <h3>Speed Rule</h3>
            <p className="lead">WPM is still computed from total passage words divided by recorded seconds.</p>
          </div>
          <div>
            <h3>Accuracy Upgrade</h3>
            <p className="lead">Scoring now uses normalized token matching with omission, substitution, insertion, and repetition handling.</p>
          </div>
        </div>
      </div>

      <div className="two-col reading-grid">
        <div className="panel">
          <h3>Assessment Setup</h3>
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
                <input type="date" name="assessedDate" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>

            <div className="field">
              <label>Voice Transcript</label>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Use the mic or paste the learner's oral reading transcript."
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

            <div className="two-col">
              <div className="field">
                <label>Comprehension %</label>
                <input
                  type="number"
                  name="comprehensionPct"
                  min="0"
                  max="100"
                  value={comprehensionPct}
                  onChange={(event) => setComprehensionPct(event.target.value)}
                />
              </div>
              <div className="field">
                <label>Pronunciation</label>
                <input name="pronunciation" value={analysis.pronunciation} readOnly />
              </div>
            </div>

            <input type="hidden" name="level" value={analysis.level} />
            <input type="hidden" name="notes" value={analysis.notes} />

            <SubmitButton>Save Reading Assessment</SubmitButton>
          </form>
        </div>

        <div className="panel">
          <div className="nav-strip" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>Voice Reading Preview</h3>
              <p className="lead">Use the microphone for live capture or paste a transcript, then review the computed Phil-IRI result below.</p>
            </div>
            <div className="reading-live-timer">
              <strong>{formatTimer(Number(readingSeconds || 0))}</strong>
              <span className="subtle">Reading Time</span>
            </div>
          </div>

          <div className="reading-passage">{passage.text || 'Enter a custom passage to begin.'}</div>

          <div className="reading-transcript-box" style={{ marginTop: 16 }}>
            {displayedTranscript || 'Speech will appear here while the learner is reading.'}
          </div>

          <div className="four-col" style={{ marginTop: 16 }}>
            <div className="metric-card">
              <h3>WR%</h3>
              <strong>{analysis.wordRecognition.toFixed(1)}%</strong>
              <span>{analysis.wrLevel}</span>
            </div>
            <div className="metric-card">
              <h3>WPM</h3>
              <strong>{analysis.wpm || 0}</strong>
              <span>{analysis.wpmLevel}</span>
            </div>
            <div className="metric-card">
              <h3>Miscues</h3>
              <strong>{analysis.majorMiscueCount}</strong>
              <span>Major Only</span>
            </div>
            <div className="metric-card">
              <h3>Level</h3>
              <strong>{analysis.level}</strong>
              <span>{analysis.pronunciation}</span>
            </div>
          </div>

          <div className="computation-box" style={{ marginTop: 16 }}>
            <div className="comp-title">Computation</div>
            <div className="comp-line"><span>Total Words</span><span>{analysis.totalWords}</span></div>
            <div className="comp-line"><span>% Miscues</span><span>{analysis.percentMiscues.toFixed(2)}%</span></div>
            <div className="comp-line"><span>Word Recognition</span><span>{analysis.wordRecognition.toFixed(2)}%</span></div>
            <div className="comp-line"><span>WPM</span><span>{analysis.wpm}</span></div>
            <div className="comp-line"><span>Final Level</span><span>{analysis.level}</span></div>
          </div>

          <div className="reading-feedback-stack">
            <div className="panel reading-feedback-panel">
              <h3>Fluency Observation</h3>
              <p className="lead" style={{ margin: 0 }}>
                {analysis.ready
                  ? analysis.fluencyObservations
                  : 'Start the mic or paste a transcript, then record the reading time to generate a result.'}
              </p>
            </div>
            <div className="panel reading-feedback-panel">
              <h3>Teacher Recommendations</h3>
              <p className="lead" style={{ margin: 0 }}>
                {analysis.ready ? analysis.teacherRecommendations : 'Recommendations will appear after transcript analysis.'}
              </p>
            </div>
            <div className="panel reading-feedback-panel">
              <h3>Comprehension Note</h3>
              <p className="lead" style={{ margin: 0 }}>{analysis.comprehensionNote}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="panel">
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

        <div className="panel">
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

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>Assessment History</h3>
        {assessments.length === 0 ? (
          <div className="subtle">No reading assessments saved yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Level</th>
                  <th>Comprehension</th>
                  <th>Pronunciation</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.last_name}, {assessment.first_name}</td>
                    <td>{assessment.assessed_date}</td>
                    <td>{assessment.level}</td>
                    <td>{assessment.comprehension_pct}%</td>
                    <td>{assessment.pronunciation}</td>
                    <td className="subtle">{assessment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

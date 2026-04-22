'use client';

import { useActionState, useMemo, useState } from 'react';

import SubmitButton from '@/components/SubmitButton';

const PASSAGES = [
  { id: 'g1_p1', title: 'Ang Aking Pamilya', grade: 1, text: 'Ang aking pamilya ay masaya. Kasama ko si Nanay, Tatay, at ang aking kapatid. Kami ay nagtutulungan sa bahay at nagdarasal bago matulog.' },
  { id: 'g2_p1', title: 'Ang Mahal Kong Nanay', grade: 2, text: 'Ang mahal kong nanay ay masipag at mapagmahal. Araw-araw ay inihahanda niya ang aming pagkain at tinutulungan niya ako sa aking aralin pagkatapos ng klase.' },
  { id: 'g3_p1', title: 'Ang Matandang Mangingisda', grade: 3, text: 'Maagang gumigising ang matandang mangingisda upang pumalaot sa dagat. Maingat niyang inihahagis ang lambat at buong tiyagang hinihintay ang huling ibibigay ng dagat.' },
  { id: 'g4_p1', title: 'Ang Kagandahan ng Kalikasan', grade: 4, text: 'Mahalagang pangalagaan ang kalikasan dahil dito nanggagaling ang malinis na hangin, tubig, at pagkain. Kapag nagtatanim tayo ng puno at nagtatapon nang tama, mas nagiging ligtas at malinis ang pamayanan.' },
  { id: 'g5_p1', title: 'Ang Pagtutulungan', grade: 5, text: 'Ang pagtutulungan ay mahalaga sa tahanan, paaralan, at pamayanan. Kapag ang bawat isa ay handang tumulong at makinig, mas mabilis natatapos ang gawain at mas nagiging maayos ang samahan ng lahat.' },
  { id: 'g6_p1', title: 'Ang Kabataang Pilipino', grade: 6, text: 'Ang kabataang Pilipino ay may mahalagang papel sa kinabukasan ng bansa. Sa pamamagitan ng sipag, disiplina, at malasakit sa kapwa, makatutulong sila sa pagbuo ng isang matatag at maunlad na lipunan.' }
];

const WPM_NORMS = {
  1: { independent: 70, instructionalLow: 31 },
  2: { independent: 100, instructionalLow: 61 },
  3: { independent: 120, instructionalLow: 91 },
  4: { independent: 140, instructionalLow: 111 },
  5: { independent: 170, instructionalLow: 141 },
  6: { independent: 190, instructionalLow: 161 }
};

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

function extractSummaryNotes({
  passageTitle,
  totalWords,
  readingSeconds,
  majorMiscues,
  wordRecognition,
  wpm,
  speedLevel,
  period,
  transcript
}) {
  return [
    `Passage: ${passageTitle}`,
    `Period: ${period}`,
    `Words: ${totalWords}`,
    `Reading Seconds: ${readingSeconds}`,
    `Major Miscues: ${majorMiscues}`,
    `Word Recognition: ${wordRecognition.toFixed(2)}%`,
    `WPM: ${wpm}`,
    `Speed Level: ${speedLevel}`,
    transcript ? `Transcript: ${transcript}` : null
  ]
    .filter(Boolean)
    .join(' | ');
}

export default function ReadingTracker({ students, assessments, action }) {
  const [state, formAction] = useActionState(action, {});
  const [selectedPassageId, setSelectedPassageId] = useState(PASSAGES[0].id);
  const [customPassage, setCustomPassage] = useState('');
  const [gradeLevel, setGradeLevel] = useState(1);
  const [period, setPeriod] = useState('Pre-test');
  const [readingSeconds, setReadingSeconds] = useState('');
  const [majorMiscues, setMajorMiscues] = useState('');
  const [comprehensionPct, setComprehensionPct] = useState('');
  const [studentId, setStudentId] = useState('');
  const [transcript, setTranscript] = useState('');

  const passage = useMemo(() => {
    if (selectedPassageId === 'custom') {
      return {
        title: 'Custom Passage',
        text: customPassage
      };
    }

    return PASSAGES.find((item) => item.id === selectedPassageId) || PASSAGES[0];
  }, [customPassage, selectedPassageId]);

  const totalWords = useMemo(() => {
    return passage.text.trim() ? passage.text.trim().split(/\s+/).length : 0;
  }, [passage.text]);

  const computed = useMemo(() => {
    const seconds = Number(readingSeconds || 0);
    const miscues = Number(majorMiscues || 0);
    const comprehension = Number(comprehensionPct || 0);
    const percentMiscues = totalWords > 0 ? (miscues / totalWords) * 100 : 0;
    const wordRecognition = Math.max(0, 100 - percentMiscues);
    const wpm = seconds > 0 && totalWords > 0 ? Math.round((totalWords / seconds) * 60) : 0;
    const wrLevel = levelFromWordRecognition(wordRecognition);
    const speedLevel = levelFromWpm(wpm, gradeLevel);
    const level = finalLevel(wrLevel, speedLevel);
    const pronunciation = pronunciationFromRecognition(wordRecognition);
    const notes = extractSummaryNotes({
      passageTitle: passage.title,
      totalWords,
      readingSeconds: seconds,
      majorMiscues: miscues,
      wordRecognition,
      wpm,
      speedLevel,
      period,
      transcript
    });

    return {
      seconds,
      miscues,
      comprehension,
      percentMiscues,
      wordRecognition,
      wpm,
      wrLevel,
      speedLevel,
      level,
      pronunciation,
      notes
    };
  }, [comprehensionPct, gradeLevel, majorMiscues, passage.title, period, readingSeconds, totalWords, transcript]);

  return (
    <section className="table-card">
      <h2>Reading Tracker</h2>
      <p className="lead">A practical Phil-IRI tracker using the official formula flow from the legacy app: choose a passage, enter miscues and reading time, then save the computed level to the database.</p>

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
                <textarea value={customPassage} onChange={(event) => setCustomPassage(event.target.value)} />
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

            <div className="two-col">
              <div className="field">
                <label>Reading Seconds</label>
                <input
                  type="number"
                  min="1"
                  value={readingSeconds}
                  onChange={(event) => setReadingSeconds(event.target.value)}
                />
              </div>
              <div className="field">
                <label>Major Miscues</label>
                <input
                  type="number"
                  min="0"
                  value={majorMiscues}
                  onChange={(event) => setMajorMiscues(event.target.value)}
                />
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
                <input name="pronunciation" value={computed.pronunciation} readOnly />
              </div>
            </div>

            <div className="field">
              <label>Transcript / Notes</label>
              <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
            </div>

            <input type="hidden" name="level" value={computed.level} />
            <input type="hidden" name="notes" value={computed.notes} />

            <SubmitButton>Save Reading Assessment</SubmitButton>
          </form>
        </div>

        <div className="panel">
          <h3>Phil-IRI Preview</h3>
          <p className="lead">{passage.title}</p>
          <div className="reading-passage">{passage.text || 'Enter a custom passage to begin.'}</div>

          <div className="four-col" style={{ marginTop: 16 }}>
            <div className="metric-card">
              <h3>WR%</h3>
              <strong>{computed.wordRecognition.toFixed(1)}%</strong>
              <span>{computed.wrLevel}</span>
            </div>
            <div className="metric-card">
              <h3>WPM</h3>
              <strong>{computed.wpm || 0}</strong>
              <span>{computed.speedLevel}</span>
            </div>
            <div className="metric-card">
              <h3>Miscues</h3>
              <strong>{computed.miscues || 0}</strong>
              <span>Major</span>
            </div>
            <div className="metric-card">
              <h3>Level</h3>
              <strong>{computed.level}</strong>
              <span>{computed.pronunciation}</span>
            </div>
          </div>

          <div className="computation-box" style={{ marginTop: 16 }}>
            <div className="comp-title">Computation</div>
            <div className="comp-line"><span>Total Words</span><span>{totalWords}</span></div>
            <div className="comp-line"><span>% Miscues</span><span>{computed.percentMiscues.toFixed(2)}%</span></div>
            <div className="comp-line"><span>Word Recognition</span><span>{computed.wordRecognition.toFixed(2)}%</span></div>
            <div className="comp-line"><span>WPM</span><span>{computed.wpm}</span></div>
            <div className="comp-line"><span>Final Level</span><span>{computed.level}</span></div>
          </div>
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

'use client';

import { useState } from 'react';
import { formatDateOnly, getCurrentDateValue } from '@/lib/date';

const QUESTION_PRESETS = [5, 6, 7, 8, 10, 15, 20];

function getLevel(score) {
  if (score >= 80) return 'Independent';
  if (score >= 50) return 'Instructional';
  return 'Frustration';
}

export default function ComprehensionTracker({
  students,
  assessments,
  action
}) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [assessedDate, setAssessedDate] = useState(getCurrentDateValue());
  const [passageTitle, setPassageTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(null);

  const correctNum = Number(correctAnswers);
  const score = totalQuestions > 0 && correctAnswers !== '' && correctNum >= 0
    ? Math.round((correctNum / totalQuestions) * 100)
    : null;
  const level = score !== null ? getLevel(score) : null;

  const studentAssessments = showHistory
    ? assessments.filter((a) => a.student_id === showHistory).slice(0, 20)
    : [];

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (!selectedStudent || !assessedDate || correctAnswers === '') {
      setMessage({ type: 'error', text: 'Please select a learner, date, and enter correct answers.' });
      return;
    }

    if (correctNum < 0 || correctNum > totalQuestions) {
      setMessage({ type: 'error', text: `Correct answers must be between 0 and ${totalQuestions}.` });
      return;
    }

    const formData = new FormData();
    formData.set('studentId', selectedStudent);
    formData.set('assessedDate', assessedDate);
    formData.set('passageTitle', passageTitle || 'General Comprehension');
    formData.set('totalQuestions', String(totalQuestions));
    formData.set('correctAnswers', String(correctNum));
    formData.set('level', level);
    formData.set('notes', notes);

    try {
      const result = await action(formData);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `Saved: ${correctNum}/${totalQuestions} (${score}%) - ${level}` });
        setCorrectAnswers('');
        setNotes('');
        setPassageTitle('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save.' });
    }
  }

  const latestPerStudent = {};
  for (const assessment of assessments) {
    if (!latestPerStudent[assessment.student_id]) {
      latestPerStudent[assessment.student_id] = assessment;
    }
  }

  return (
    <section className="table-card">
      <div className="nav-strip" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Comprehension Assessment</h2>
          <p className="lead">Record reading comprehension results per learner based on Phil-IRI. Enter the total questions and correct answers — the score and level are computed automatically.</p>
        </div>
      </div>

      {message ? <div className={`banner ${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div> : null}

      <div className="two-col">
        <div className="panel">
          <h3>Record Assessment</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label htmlFor="ca-student">Learner</label>
              <select id="ca-student" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Select learner</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ca-date">Assessment Date</label>
              <input id="ca-date" type="date" value={assessedDate} onChange={(e) => setAssessedDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ca-passage">Passage Title (optional)</label>
              <input id="ca-passage" value={passageTitle} onChange={(e) => setPassageTitle(e.target.value)} placeholder="e.g. Ang Aking Pamilya" />
            </div>
            <div className="field">
              <label htmlFor="ca-total">Total Questions</label>
              <select id="ca-total" value={totalQuestions} onChange={(e) => { setTotalQuestions(Number(e.target.value)); setCorrectAnswers(''); }}>
                {QUESTION_PRESETS.map((n) => (
                  <option key={n} value={n}>{n} questions{n === 20 ? ' (GST)' : n <= 8 ? ' (Graded Passage)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ca-correct">Correct Answers</label>
              <input
                id="ca-correct"
                type="number"
                min={0}
                max={totalQuestions}
                value={correctAnswers}
                onChange={(e) => setCorrectAnswers(e.target.value)}
              />
            </div>
            {score !== null ? (
              <div className="field">
                <label>Result</label>
                <div>
                  <strong>{correctNum}/{totalQuestions}</strong>
                  <span style={{ margin: '0 8px' }}>&rarr;</span>
                  <strong>{score}%</strong>
                  <span style={{ marginLeft: 8 }}>
                    <span className={`pill ${level === 'Independent' ? 'green' : level === 'Instructional' ? 'amber' : 'red'}`}>{level}</span>
                  </span>
                </div>
              </div>
            ) : null}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="ca-notes">Notes (optional)</label>
              <textarea id="ca-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <button type="submit" className="button">Save Assessment</button>
          </form>
        </div>

        <div className="panel">
          <h3>Latest Results</h3>
          {students.length === 0 ? (
            <div className="subtle">No students in this section.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const latest = latestPerStudent[student.id];
                    return (
                      <tr key={student.id}>
                        <td>{student.last_name}, {student.first_name}</td>
                        <td>{latest ? `${latest.correct_answers}/${latest.total_questions} (${latest.score}%)` : '-'}</td>
                        <td>{latest ? <span className={`pill ${latest.level === 'Independent' ? 'green' : latest.level === 'Instructional' ? 'amber' : 'red'}`}>{latest.level}</span> : '-'}</td>
                        <td>{latest ? formatDateOnly(latest.assessed_date) : '-'}</td>
                        <td>
                          <button type="button" className="button-secondary" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => setShowHistory(showHistory === student.id ? null : student.id)}>
                            {showHistory === student.id ? 'Hide' : 'History'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showHistory && studentAssessments.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <h4>History for {students.find((s) => s.id === showHistory)?.last_name}, {students.find((s) => s.id === showHistory)?.first_name}</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Passage</th>
                      <th>Questions</th>
                      <th>Score</th>
                      <th>Level</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAssessments.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDateOnly(a.assessed_date)}</td>
                        <td>{a.passage_title}</td>
                        <td>{a.correct_answers}/{a.total_questions}</td>
                        <td>{a.score}%</td>
                        <td><span className={`pill ${a.level === 'Independent' ? 'green' : a.level === 'Instructional' ? 'amber' : 'red'}`}>{a.level}</span></td>
                        <td className="subtle">{a.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

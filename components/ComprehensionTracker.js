'use client';

import { useState } from 'react';
import { formatDateOnly, getCurrentDateValue } from '@/lib/date';

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
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(null);

  const studentAssessments = showHistory
    ? assessments.filter((a) => a.student_id === showHistory).slice(0, 20)
    : [];

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (!selectedStudent || !assessedDate || score === '') {
      setMessage({ type: 'error', text: 'Please select a student, date, and enter a score.' });
      return;
    }

    const scoreNum = Number(score);
    if (scoreNum < 0 || scoreNum > 100) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 100.' });
      return;
    }

    const formData = new FormData();
    formData.set('studentId', selectedStudent);
    formData.set('assessedDate', assessedDate);
    formData.set('passageTitle', passageTitle || 'General Comprehension');
    formData.set('score', String(scoreNum));
    formData.set('level', getLevel(scoreNum));
    formData.set('notes', notes);

    try {
      const result = await action(formData);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Comprehension assessment saved.' });
        setScore('');
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
          <p className="lead">Record reading comprehension scores per learner. Score of 80+ is Independent, 50-79 is Instructional, below 50 is Frustration.</p>
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
              <label htmlFor="ca-score">Score (0-100)</label>
              <input id="ca-score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            {score !== '' && Number(score) >= 0 && Number(score) <= 100 ? (
              <div className="field">
                <label>Level</label>
                <div><span className={`pill ${getLevel(Number(score)) === 'Independent' ? 'green' : getLevel(Number(score)) === 'Instructional' ? 'amber' : 'red'}`}>{getLevel(Number(score))}</span></div>
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
                        <td>{latest ? `${latest.score}%` : '-'}</td>
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

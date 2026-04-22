'use client';

import { useActionState, useState } from 'react';

import SubmitButton from '@/components/SubmitButton';

const SCIENCE_QUIZZES = {
  'Living Things': [
    {
      q: 'Living things need food, water, and _____ to survive.',
      options: ['sunlight', 'wind', 'rocks', 'noise'],
      answer: 0
    },
    {
      q: 'Which of these is NOT a living thing?',
      options: ['tree', 'stone', 'mushroom', 'ant'],
      answer: 1
    },
    {
      q: 'Animals that eat only plants are called _____.',
      options: ['carnivores', 'omnivores', 'herbivores', 'predators'],
      answer: 2
    }
  ],
  'Matter and Properties': [
    {
      q: 'Matter is anything that has _____.',
      options: ['sound', 'mass and occupies space', 'color only', 'movement only'],
      answer: 1
    },
    {
      q: 'Which state of matter keeps its own shape?',
      options: ['gas', 'liquid', 'solid', 'steam'],
      answer: 2
    },
    {
      q: 'Water turning into ice is called _____.',
      options: ['melting', 'freezing', 'evaporation', 'boiling'],
      answer: 1
    }
  ],
  'Water Cycle': [
    {
      q: 'Water vapor cooling and turning into clouds is called _____.',
      options: ['evaporation', 'condensation', 'collection', 'melting'],
      answer: 1
    },
    {
      q: 'Rain falling from clouds is called _____.',
      options: ['precipitation', 'condensation', 'freezing', 'absorption'],
      answer: 0
    },
    {
      q: 'The sun mainly causes water to _____.',
      options: ['freeze', 'evaporate', 'sink', 'turn to stone'],
      answer: 1
    }
  ]
};

export default function ScienceTracker({ sectionId, students, summary, scores, action }) {
  const [state, formAction] = useActionState(action, {});
  const [topicName, setTopicName] = useState(Object.keys(SCIENCE_QUIZZES)[0]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [draftScores, setDraftScores] = useState({});
  const questions = SCIENCE_QUIZZES[topicName];

  const autoScore = questions.reduce((count, question, index) => {
    return count + (Number(selectedAnswers[index]) === question.answer ? 1 : 0);
  }, 0);
  const autoPercent = Math.round((autoScore / questions.length) * 100);

  return (
    <section className="table-card">
      <div className="nav-strip" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Science Check</h2>
          <p className="lead">Ported from the legacy teacher dashboard as a post-lesson concept quiz with real class result storage.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Topic Quiz</h3>
          <div className="field">
            <label>Topic</label>
            <select value={topicName} onChange={(event) => {
              setTopicName(event.target.value);
              setSelectedAnswers({});
            }}>
              {Object.keys(SCIENCE_QUIZZES).map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="page-grid">
            {questions.map((question, index) => (
              <div key={question.q} className="panel" style={{ background: 'var(--surface-alt)' }}>
                <strong>{index + 1}. {question.q}</strong>
                <div className="form-grid" style={{ marginTop: 10 }}>
                  {question.options.map((option, optionIndex) => (
                    <label key={option} className="subtle" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name={`science-q-${index}`}
                        checked={Number(selectedAnswers[index]) === optionIndex}
                        onChange={() => setSelectedAnswers((current) => ({ ...current, [index]: optionIndex }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="banner success" style={{ marginTop: 16 }}>
            Demo score: {autoScore}/{questions.length} ({autoPercent}%)
          </div>
        </div>

        <div className="panel">
          <h3>Encode Class Results</h3>
          <form
            action={formAction}
            className="form-grid"
            onSubmit={() => {
              const form = document.getElementById('science-scores-json');
              const payload = students
                .filter((student) => draftScores[student.id] !== undefined && draftScores[student.id] !== '')
                .map((student) => {
                  const correct = Number(draftScores[student.id] || 0);
                  const percent = Math.round((correct / questions.length) * 100);
                  return { studentId: student.id, correct, percent };
                });
              form.value = JSON.stringify(payload);
            }}
          >
            {state?.error ? <div className="banner error">{state.error}</div> : null}
            {state?.success ? <div className="banner success">{state.success}</div> : null}
            <input type="hidden" name="sectionId" value={sectionId} />
            <input type="hidden" name="topicName" value={topicName} />
            <input type="hidden" name="totalItems" value={questions.length} />
            <input id="science-scores-json" type="hidden" name="scores" />

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Correct</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const value = draftScores[student.id] ?? '';
                    const percent = value === '' ? '-' : `${Math.round((Number(value) / questions.length) * 100)}%`;
                    return (
                      <tr key={student.id}>
                        <td>{student.last_name}, {student.first_name}</td>
                        <td>
                          <input
                            className="score-input"
                            type="number"
                            min={0}
                            max={questions.length}
                            value={value}
                            onChange={(event) =>
                              setDraftScores((current) => ({ ...current, [student.id]: event.target.value }))
                            }
                          />
                        </td>
                        <td>{percent}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <SubmitButton>Save Science Scores</SubmitButton>
          </form>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="panel">
          <h3>Recent Sessions</h3>
          {summary.length === 0 ? (
            <div className="subtle">No science quiz sessions yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Class Avg</th>
                    <th>Passed</th>
                    <th>Needs Review</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.id}>
                      <td>{row.quiz_date}</td>
                      <td>{row.topic_name}</td>
                      <td>{row.class_avg ?? 0}%</td>
                      <td>{row.passed}</td>
                      <td>{row.needs_review}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h3>Score History</h3>
          {scores.length === 0 ? (
            <div className="subtle">No science score history yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>Percent</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((row) => (
                    <tr key={row.id}>
                      <td>{row.last_name}, {row.first_name}</td>
                      <td>{row.topic_name}</td>
                      <td>{row.raw_score}/{row.total_items}</td>
                      <td>{row.pct_score}%</td>
                      <td>{new Date(row.recorded_at).toLocaleDateString('en-PH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

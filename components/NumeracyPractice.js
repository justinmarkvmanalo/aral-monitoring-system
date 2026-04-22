'use client';

import { useState, useTransition } from 'react';

const SKILL_OPTIONS = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '-' },
  { value: 'multiplication', label: 'Multiplication', symbol: 'x' },
  { value: 'division', label: 'Division', symbol: '/' },
  { value: 'problem_solving', label: 'Problem Solving', symbol: 'PS' }
];

const NAMES = ['Ana', 'Ben', 'Carla', 'Diego', 'Ella', 'Mico', 'Lia', 'Noah'];
const OBJECTS = ['mangoes', 'notebooks', 'pencils', 'books', 'candies', 'balls'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildProblem(level) {
  const templateType = level === 1 ? randomInt(1, 3) : randomInt(1, 5);
  const name1 = NAMES[randomInt(0, NAMES.length - 1)];
  const name2 = NAMES[randomInt(0, NAMES.length - 1)];
  const object = OBJECTS[randomInt(0, OBJECTS.length - 1)];

  if (templateType === 1) {
    const a = level === 1 ? randomInt(2, 9) : randomInt(10, 35);
    const b = level === 1 ? randomInt(1, 9) : randomInt(5, 20);
    return {
      q: `${name1} has ${a} ${object}. ${name2} gives ${b} more. How many ${object} are there now?`,
      ans: a + b,
      isProblem: true
    };
  }

  if (templateType === 2) {
    const a = level === 1 ? randomInt(7, 18) : randomInt(25, 80);
    const b = level === 1 ? randomInt(1, a - 1) : randomInt(5, a - 5);
    return {
      q: `There are ${a} ${object} in a basket. ${b} are taken away. How many are left?`,
      ans: a - b,
      isProblem: true
    };
  }

  if (templateType === 3) {
    const a = level === 1 ? randomInt(2, 7) : randomInt(3, 12);
    const b = level === 1 ? randomInt(2, 5) : randomInt(4, 10);
    return {
      q: `Each box has ${a} ${object}. There are ${b} boxes. How many ${object} are there in all?`,
      ans: a * b,
      isProblem: true
    };
  }

  if (templateType === 4) {
    const a = randomInt(30, 90);
    const b = randomInt(5, 25);
    const c = randomInt(5, 20);
    return {
      q: `${name1} has ${a} pesos. A notebook costs ${b} pesos and a pencil costs ${c} pesos. How much money is left?`,
      ans: a - b - c,
      isProblem: true
    };
  }

  const a = randomInt(4, 12);
  const b = randomInt(4, 10);
  const c = randomInt(6, 20);
  return {
    q: `There are ${a} trees with ${b} ${object} each. ${c} ${object} are given away. How many remain?`,
    ans: a * b - c,
    isProblem: true
  };
}

function generateQuestion(skill, level) {
  let a;
  let b;
  let answer;

  if (skill === 'addition') {
    if (level === 1) {
      a = randomInt(1, 9);
      b = randomInt(1, 9);
    } else if (level === 2) {
      a = randomInt(10, 99);
      b = randomInt(10, 99);
    } else {
      a = randomInt(100, 999);
      b = randomInt(100, 999);
    }
    answer = a + b;
    return { q: `${a} + ${b} = ___`, ans: answer, isProblem: false };
  }

  if (skill === 'subtraction') {
    if (level === 1) {
      a = randomInt(3, 18);
      b = randomInt(1, a - 1);
    } else if (level === 2) {
      a = randomInt(20, 99);
      b = randomInt(10, a - 1);
    } else {
      a = randomInt(200, 999);
      b = randomInt(100, a - 1);
    }
    answer = a - b;
    return { q: `${a} - ${b} = ___`, ans: answer, isProblem: false };
  }

  if (skill === 'multiplication') {
    if (level === 1) {
      a = randomInt(1, 9);
      b = randomInt(1, 9);
    } else if (level === 2) {
      a = randomInt(2, 12);
      b = randomInt(10, 19);
    } else {
      a = randomInt(11, 19);
      b = randomInt(11, 19);
    }
    answer = a * b;
    return { q: `${a} x ${b} = ___`, ans: answer, isProblem: false };
  }

  if (skill === 'division') {
    if (level === 1) {
      b = randomInt(1, 9);
      answer = randomInt(1, 9);
    } else if (level === 2) {
      b = randomInt(2, 9);
      answer = randomInt(2, 12);
    } else {
      b = randomInt(2, 12);
      answer = randomInt(10, 20);
    }
    a = b * answer;
    return { q: `${a} / ${b} = ___`, ans: answer, isProblem: false };
  }

  return buildProblem(level);
}

function normalizeDrill(drill) {
  if (!drill) return null;
  return {
    id: drill.id,
    sectionId: drill.section_id,
    skill: drill.skill,
    skillName: drill.skill_name,
    level: Number(drill.level),
    totalItems: Number(drill.total_items),
    label: drill.label,
    questions: Array.isArray(drill.questions) ? drill.questions : [],
    saved: Boolean(drill.saved)
  };
}

function mapScoreRow(row) {
  const masteryMap = {
    Mastered: 'mastered',
    Developing: 'developing',
    'Below Mastery': 'needs'
  };

  return {
    studentId: row.student_id,
    studentName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    skill: row.skill || '',
    skillName: row.skill_name || '',
    level: Number(row.level || 1),
    total: Number(row.total_items || 0),
    correct: Number(row.raw_score || 0),
    percent: Number(row.pct_score || 0),
    mastery: masteryMap[row.mastery] || 'needs',
    masteryLabel: row.mastery || '',
    sessionLabel: row.session_label || `Quiz ${row.quiz_id || ''}`.trim(),
    scoredAt: row.recorded_at
  };
}

function getMasteryMeta(percent) {
  if (percent >= 75) return { key: 'mastered', label: 'Mastered', className: 'pill green' };
  if (percent >= 50) return { key: 'developing', label: 'Developing', className: 'pill amber' };
  return { key: 'needs', label: 'Needs Support', className: 'pill red' };
}

export default function NumeracyPractice({
  sectionId,
  students,
  initialDrill,
  initialScores,
  saveDrillAction,
  saveScoresAction
}) {
  const [activeTab, setActiveTab] = useState('drill');
  const [skill, setSkill] = useState(initialDrill?.skill || 'addition');
  const [level, setLevel] = useState(initialDrill?.level || 1);
  const [totalItems, setTotalItems] = useState(initialDrill?.totalItems || 10);
  const [sessionLabel, setSessionLabel] = useState(initialDrill?.label || '');
  const [showAnswers, setShowAnswers] = useState(false);
  const [drill, setDrill] = useState(normalizeDrill(initialDrill));
  const [scores, setScores] = useState(initialScores.map(mapScoreRow));
  const [draftScores, setDraftScores] = useState({});
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  function generateDrill() {
    const skillOption = SKILL_OPTIONS.find((option) => option.value === skill);
    const questions = Array.from({ length: totalItems }, () => generateQuestion(skill, level));
    const nextDrill = {
      id: null,
      sectionId,
      skill,
      skillName: skillOption.label,
      level,
      totalItems,
      label: sessionLabel || `${skillOption.label} Drill - Level ${level}`,
      questions,
      saved: false
    };

    setDrill(nextDrill);
    setDraftScores({});
    setShowAnswers(false);
    setActiveTab('drill');
    setMessage({ type: 'success', text: `Generated ${totalItems} numeracy items.` });

    startTransition(async () => {
      const formData = new FormData();
      formData.set('sectionId', String(sectionId));
      formData.set('skill', nextDrill.skill);
      formData.set('skillName', nextDrill.skillName);
      formData.set('level', String(nextDrill.level));
      formData.set('totalItems', String(nextDrill.totalItems));
      formData.set('label', nextDrill.label);
      formData.set('questions', JSON.stringify(nextDrill.questions));

      try {
        const result = await saveDrillAction(formData);
        setDrill(normalizeDrill(result.drill));
        setMessage({ type: 'success', text: 'Drill generated and saved.' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to save drill.' });
      }
    });
  }

  function updateDraftScore(studentId, value) {
    const normalized = Math.max(0, Math.min(drill?.totalItems || 0, Number(value || 0)));
    setDraftScores((current) => ({ ...current, [studentId]: normalized }));
  }

  function saveAllScores() {
    if (!drill?.id) {
      setMessage({ type: 'error', text: 'Generate and save a drill first.' });
      return;
    }

    const payload = students
      .filter((student) => draftScores[student.id] !== undefined && draftScores[student.id] !== '')
      .map((student) => {
        const correct = Number(draftScores[student.id] || 0);
        const percent = drill.totalItems ? Math.round((correct / drill.totalItems) * 100) : 0;
        const mastery = getMasteryMeta(percent);
        return {
          studentId: student.id,
          correct,
          percent,
          mastery:
            mastery.key === 'mastered'
              ? 'Mastered'
              : mastery.key === 'developing'
                ? 'Developing'
                : 'Below Mastery',
          studentName: `${student.first_name} ${student.last_name}`.trim()
        };
      });

    if (payload.length === 0) {
      setMessage({ type: 'error', text: 'Enter at least one score before saving.' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('drillId', String(drill.id));
      formData.set(
        'scores',
        JSON.stringify(
          payload.map((score) => ({
            studentId: score.studentId,
            correct: score.correct,
            percent: score.percent,
            mastery: score.mastery
          }))
        )
      );

      try {
        const result = await saveScoresAction(formData);
        const savedRows = payload.map((score) => ({
          studentId: score.studentId,
          studentName: score.studentName,
          skill: drill.skill,
          skillName: drill.skillName,
          level: drill.level,
          total: drill.totalItems,
          correct: score.correct,
          percent: score.percent,
          mastery:
            score.mastery === 'Mastered'
              ? 'mastered'
              : score.mastery === 'Developing'
                ? 'developing'
                : 'needs',
          masteryLabel: score.mastery,
          sessionLabel: drill.label,
          scoredAt: new Date().toISOString()
        }));

        setScores((current) => [...savedRows, ...current]);
        setDrill((current) => (current ? { ...current, saved: true } : current));
        setMessage({ type: 'success', text: `Saved ${result.saved} numeracy score(s).` });
        setActiveTab('mastery');
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to save scores.' });
      }
    });
  }

  function printDrill() {
    if (!drill?.questions?.length) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const questionsHtml = drill.questions
      .map((question, index) => {
        if (question.isProblem) {
          return `<div style="margin-bottom:16px;padding:12px;border:1px solid #ddd;border-radius:6px;">
            <div style="font-weight:700;margin-bottom:6px;">${index + 1}. ${question.q}</div>
            <div>Answer: _____________________</div>
          </div>`;
        }

        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eee;">
          <strong>${index + 1}.</strong>
          <span>${question.q.replace('___', '________')}</span>
        </div>`;
      })
      .join('');

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${drill.label}</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;max-width:760px;margin:0 auto;">
          <h1 style="font-size:22px;margin-bottom:4px;">${drill.label}</h1>
          <p style="color:#555;margin-top:0;">${drill.skillName} | Level ${drill.level} | ${drill.totalItems} items</p>
          <div style="display:flex;gap:16px;margin:16px 0 24px;">
            <span>Name: __________________</span>
            <span>Date: __________________</span>
            <span>Score: ____ / ${drill.totalItems}</span>
          </div>
          ${questionsHtml}
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const masteryRows = students.map((student) => {
    const studentScores = scores.filter((row) => row.studentId === student.id);
    const averages = Object.fromEntries(
      SKILL_OPTIONS.map((option) => {
        const values = studentScores.filter((row) => row.skill === option.value).map((row) => row.percent);
        const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
        return [option.value, average];
      })
    );

    return {
      studentId: student.id,
      studentName: `${student.last_name}, ${student.first_name}`,
      averages
    };
  });

  const interventionRows = masteryRows.flatMap((row) =>
    SKILL_OPTIONS.map((option) => ({
      studentName: row.studentName,
      skillName: option.label,
      average: row.averages[option.value]
    })).filter((entry) => entry.average !== null && entry.average < 75)
  );

  return (
    <section className="table-card numeracy-panel">
      <div className="nav-strip" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Numeracy Practice</h2>
          <p className="lead">Generate class drills, encode scores, and track mastery using the legacy PHP workflow as the reference.</p>
        </div>
        <div className="inline-actions">
          <button type="button" className={activeTab === 'drill' ? 'button' : 'button-secondary'} onClick={() => setActiveTab('drill')}>Drill</button>
          <button type="button" className={activeTab === 'encode' ? 'button' : 'button-secondary'} onClick={() => setActiveTab('encode')}>Encode</button>
          <button type="button" className={activeTab === 'mastery' ? 'button' : 'button-secondary'} onClick={() => setActiveTab('mastery')}>Mastery</button>
          <button type="button" className={activeTab === 'history' ? 'button' : 'button-secondary'} onClick={() => setActiveTab('history')}>History</button>
        </div>
      </div>

      {message ? <div className={`banner ${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div> : null}

      {activeTab === 'drill' ? (
        <div className="two-col numeracy-grid">
          <div className="panel">
            <h3>Drill Setup</h3>
            <div className="form-grid">
              <div className="field">
                <label>Skill</label>
                <select value={skill} onChange={(event) => setSkill(event.target.value)}>
                  {SKILL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="two-col">
                <div className="field">
                  <label>Level</label>
                  <select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                  </select>
                </div>
                <div className="field">
                  <label>Items</label>
                  <select value={totalItems} onChange={(event) => setTotalItems(Number(event.target.value))}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Session Label</label>
                <input value={sessionLabel} onChange={(event) => setSessionLabel(event.target.value)} placeholder="Week 3 Addition Drill" />
              </div>
              <button type="button" className="button" disabled={pending} onClick={generateDrill}>
                {pending ? 'Saving...' : 'Generate Drill'}
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>How It Works</h3>
            <div className="lead">
              <p>1. Pick a skill, level, and item count.</p>
              <p>2. Generate a class drill and print or display it.</p>
              <p>3. Move to the encode tab to save each learner&apos;s score.</p>
              <p>4. Review mastery and intervention lists from saved results.</p>
            </div>
          </div>

          {drill ? (
            <div className="panel numeracy-preview" style={{ gridColumn: '1 / -1' }}>
              <div className="nav-strip" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ marginBottom: 8 }}>{drill.label}</h3>
                  <div className="subtle">{drill.skillName} | Level {drill.level} | {drill.totalItems} items</div>
                </div>
                <div className="inline-actions">
                  <button type="button" className="button-secondary" onClick={() => setShowAnswers((current) => !current)}>
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                  </button>
                  <button type="button" className="button-secondary" onClick={printDrill}>Print</button>
                </div>
              </div>
              <div className="numeracy-questions">
                {drill.questions.map((question, index) => (
                  <div key={`${question.q}-${index}`} className="numeracy-question">
                    <strong>{index + 1}.</strong>
                    <div style={{ flex: 1 }}>
                      <div>{question.q}</div>
                      {showAnswers ? <div className="subtle">Answer: {question.ans}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'encode' ? (
        <div className="panel">
          <div className="nav-strip" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>Encode Scores</h3>
              <div className="subtle">
                {drill ? `${drill.label} | ${drill.totalItems} items` : 'Generate a drill first.'}
              </div>
            </div>
            <button
              type="button"
              className="button"
              disabled={pending || !drill || drill.saved}
              onClick={saveAllScores}
            >
              {drill?.saved ? 'Scores Saved' : pending ? 'Saving...' : 'Save All Scores'}
            </button>
          </div>

          {!drill ? (
            <div className="subtle">Generate a drill first before encoding scores.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Correct</th>
                    <th>Percent</th>
                    <th>Mastery</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const value = draftScores[student.id] ?? '';
                    const percent = value === '' ? null : Math.round((Number(value) / drill.totalItems) * 100);
                    const mastery = percent === null ? null : getMasteryMeta(percent);

                    return (
                      <tr key={student.id}>
                        <td>{student.last_name}, {student.first_name}</td>
                        <td>
                          <input
                            className="score-input"
                            type="number"
                            min={0}
                            max={drill.totalItems}
                            value={value}
                            onChange={(event) => updateDraftScore(student.id, event.target.value)}
                          />
                        </td>
                        <td>{percent === null ? '-' : `${percent}%`}</td>
                        <td>{mastery ? <span className={mastery.className}>{mastery.label}</span> : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'mastery' ? (
        <div className="page-grid">
          <div className="panel">
            <h3>Class Mastery</h3>
            {scores.length === 0 ? (
              <div className="subtle">No numeracy scores saved yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      {SKILL_OPTIONS.map((option) => (
                        <th key={option.value}>{option.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masteryRows.map((row) => (
                      <tr key={row.studentId}>
                        <td>{row.studentName}</td>
                        {SKILL_OPTIONS.map((option) => {
                          const average = row.averages[option.value];
                          const mastery = average === null ? null : getMasteryMeta(average);
                          return (
                            <td key={option.value}>
                              {average === null ? '-' : <span className={mastery.className}>{average}%</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Needs Intervention</h3>
            {interventionRows.length === 0 ? (
              <div className="subtle">All tracked numeracy averages are at or above 75%.</div>
            ) : (
              <div className="page-grid">
                {interventionRows.map((row) => (
                  <div key={`${row.studentName}-${row.skillName}`} className="metric-card">
                    <h3>{row.studentName}</h3>
                    <strong>{row.average}%</strong>
                    <span>{row.skillName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <div className="panel">
          <h3>Score History</h3>
          {scores.length === 0 ? (
            <div className="subtle">No numeracy history yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Skill</th>
                    <th>Session</th>
                    <th>Score</th>
                    <th>Percent</th>
                    <th>Mastery</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, index) => {
                    const mastery = getMasteryMeta(score.percent);
                    return (
                      <tr key={`${score.studentId}-${score.scoredAt}-${index}`}>
                        <td>{score.studentName}</td>
                        <td>{score.skillName || score.skill}</td>
                        <td>{score.sessionLabel}</td>
                        <td>{score.correct}/{score.total}</td>
                        <td>{score.percent}%</td>
                        <td><span className={mastery.className}>{score.masteryLabel || mastery.label}</span></td>
                        <td>{new Date(score.scoredAt).toLocaleDateString('en-PH')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

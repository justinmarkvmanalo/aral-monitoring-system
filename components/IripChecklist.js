'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';

import SubmitButton from '@/components/SubmitButton';

const IRIP_SKILLS = [
  {
    week: 1,
    items: [
      'Identifying high-frequency words accurately.',
      'Identifying roots of high-frequency words (nouns, verbs, adjectives).'
    ]
  },
  {
    week: 2,
    items: [
      'Identifying synonyms and antonyms.',
      'Using vocabulary in a new context.',
      'Identifying words in different functions (noun, verb, and adjective).'
    ]
  },
  {
    week: 3,
    items: [
      'Reading words accurately and automatically according to patterns.',
      'Reading sentences with appropriate speed, accuracy, and expression.'
    ]
  },
  {
    week: 4,
    items: [
      'Noting important story elements (character, setting, events).',
      'Sequencing events.',
      'Identifying problem and solution.'
    ]
  },
  {
    week: 5,
    items: [
      'Inferring character feelings and traits.',
      'Relating story events to personal experiences.'
    ]
  },
  {
    week: 6,
    items: [
      'Identifying cause and effect of events.',
      'Predicting possible endings.',
      'Drawing conclusions.'
    ]
  },
  {
    week: 7,
    items: [
      'Noting significant details.',
      'Summarizing texts.'
    ]
  },
  {
    week: 8,
    items: [
      'Identifying text types (procedural text and descriptive text).',
      'Drawing conclusions.'
    ]
  }
];

const DEFAULT_ROWS = IRIP_SKILLS.flatMap(({ week, items }) =>
  items.map((skill) => ({
    week,
    skill,
    status: '',
    notes: ''
  }))
);

function cloneDefaultRows() {
  return DEFAULT_ROWS.map((row) => ({ ...row }));
}

function formatStudentName(student) {
  if (!student) return '';
  return `${student.last_name}, ${student.first_name}`;
}

export default function IripChecklist({
  students,
  records,
  section,
  defaultTutorName,
  action
}) {
  const [state, formAction] = useActionState(action, {});
  const [studentId, setStudentId] = useState('');
  const [tutorName, setTutorName] = useState(defaultTutorName || '');
  const [rows, setRows] = useState(cloneDefaultRows);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(studentId)) || null,
    [studentId, students]
  );
  const learnerName = selectedStudent ? formatStudentName(selectedStudent) : '';

  const gradeLabel = section?.grade_level ? `Grade ${section.grade_level}` : '';

  const recordLookup = useMemo(() => {
    const lookup = new Map();
    for (const record of records) {
      lookup.set(String(record.student_id), record);
    }
    return lookup;
  }, [records]);

  useEffect(() => {
    if (!studentId) {
      setRows(cloneDefaultRows());
      return;
    }

    const saved = recordLookup.get(String(studentId));
    if (!saved?.rows?.length) {
      setRows(cloneDefaultRows());
      if (!saved?.tutor_name && defaultTutorName) {
        setTutorName(defaultTutorName);
      }
      return;
    }

    const savedRows = cloneDefaultRows().map((row, index) => ({
      ...row,
      status: saved.rows[index]?.status || '',
      notes: saved.rows[index]?.notes || ''
    }));

    setRows(savedRows);
    setTutorName(saved.tutor_name || defaultTutorName || '');
  }, [defaultTutorName, recordLookup, studentId]);

  const completedRows = rows.filter((row) => row.status).length;
  const progressPct = rows.length ? Math.round((completedRows / rows.length) * 100) : 0;

  function updateRow(index, key, value) {
    setRows((current) =>
      current.map((row, rowIndex) => (
        rowIndex === index
          ? { ...row, [key]: value }
          : row
      ))
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="table-card irip-shell">
      <div className="nav-strip">
        <div>
          <h2 style={{ marginBottom: 8 }}>IRIP Checklist</h2>
          <p className="lead">
            Individual Reading Intervention Plan checklist with weekly subskills, observation notes, and a print-ready landscape layout.
          </p>
        </div>
        <div className="inline-actions no-print">
          <button type="button" className="button-secondary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      <div className="irip-card">
        <div className="irip-header">
          <div className="irip-school">
            Republic of the Philippines • Department of Education • Region IV-A
            <br />
            Schools Division of Quezon Province • Agdangan Central Elementary School
            <br />
            Poblacion I, Agdangan, Quezon
          </div>
          <div className="irip-annex">ANNEX C</div>
          <div className="irip-title">Individual Reading Intervention Plan (IRIP) Checklist</div>
        </div>

        <form action={formAction} className="form-grid">
          {state?.error ? <div className="banner error">{state.error}</div> : null}
          {state?.success ? <div className="banner success">{state.success}</div> : null}

          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="rows" value={JSON.stringify(rows)} />

          <div className="irip-learner-directory no-print">
            <div className="irip-learner-directory-head">
              <strong>Learners</strong>
              <span className="subtle">Select a learner to edit. Use DL to download right away.</span>
            </div>
            <div className="irip-learner-list">
              {students.length === 0 ? (
                <div className="subtle">No learners yet.</div>
              ) : (
                students.map((student) => {
                  const isSelected = String(student.id) === String(studentId);
                  const savedRecord = recordLookup.get(String(student.id));
                  const savedCount = Array.isArray(savedRecord?.rows)
                    ? savedRecord.rows.filter((row) => row?.status).length
                    : 0;

                  return (
                    <div
                      key={student.id}
                      className={`irip-learner-card ${isSelected ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className="irip-learner-main"
                        onClick={() => setStudentId(String(student.id))}
                      >
                        <strong>{formatStudentName(student)}</strong>
                        <span className="subtle">
                          {savedCount > 0 ? `${savedCount}/${DEFAULT_ROWS.length} items saved` : 'No saved progress yet'}
                        </span>
                      </button>
                      <a
                        href={`/api/teacher/irip/${student.id}/docx`}
                        className={isSelected ? 'button' : 'button-secondary'}
                      >
                        DL
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="irip-info-row">
            <div className="field">
              <label>Learner</label>
              <input value={learnerName} readOnly placeholder="Choose a learner from the list above" />
            </div>

            <div className="field">
              <label>Grade Level</label>
              <input name="gradeLevel" value={gradeLabel} readOnly />
            </div>

            <div className="field">
              <label>Tutor&apos;s Name</label>
              <input
                name="tutorName"
                value={tutorName}
                onChange={(event) => setTutorName(event.target.value)}
                placeholder="Enter tutor name"
              />
            </div>
          </div>

          <div className="irip-progress">
            <span className="subtle">Completion</span>
            <div className="irip-progress-track" aria-hidden="true">
              <div className="irip-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <strong>{progressPct}%</strong>
          </div>

          <div className="irip-table-wrap">
            <table className="table irip-table">
              <thead>
                <tr>
                  <th style={{ width: 78 }}>Week</th>
                  <th>Reading Subskill</th>
                  <th style={{ width: 180 }}>Status</th>
                  <th style={{ width: '32%' }}>Tutor Notes / Observations</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const showWeek =
                    index === 0 || rows[index - 1].week !== row.week;

                  return (
                    <tr key={`${row.week}-${row.skill}`}>
                      <td>
                        {showWeek ? <span className="irip-week-badge">{row.week}</span> : null}
                      </td>
                      <td className="irip-skill">{row.skill}</td>
                      <td>
                        <select
                          value={row.status}
                          onChange={(event) => updateRow(index, 'status', event.target.value)}
                          className={`irip-status irip-status-${row.status || 'empty'}`}
                        >
                          <option value="">Select</option>
                          <option value="observed">Observed</option>
                          <option value="partial">Partially Observed</option>
                          <option value="not">Not Observed</option>
                        </select>
                      </td>
                      <td>
                        <textarea
                          value={row.notes}
                          onChange={(event) => updateRow(index, 'notes', event.target.value)}
                          className="irip-notes"
                          rows={1}
                          placeholder="Add notes..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="irip-legend">
            <div className="irip-legend-item">
              <span className="irip-mark observed">✓</span>
              <span>Observed</span>
              <span className="subtle">ready to proceed to next topic</span>
            </div>
            <div className="irip-legend-item">
              <span className="irip-mark partial">~</span>
              <span>Partially Observed</span>
              <span className="subtle">needs additional practice</span>
            </div>
            <div className="irip-legend-item">
              <span className="irip-mark not">✗</span>
              <span>Not Observed</span>
              <span className="subtle">reteach current topic</span>
            </div>
          </div>

          <div className="actions no-print" style={{ justifyContent: 'flex-end' }}>
            <SubmitButton disabled={!selectedStudent}>Save IRIP</SubmitButton>
          </div>
        </form>
      </div>
    </section>
  );
}

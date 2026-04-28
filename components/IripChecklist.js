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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M6 12h8m0 0-3.5-3.5M14 12l-3.5 3.5M18 6v12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IripForwardForm({ action, studentId, disabled }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="irip-forward-form">
      <input type="hidden" name="studentId" value={studentId} />
      <SubmitButton className="button-secondary irip-action-button" disabled={disabled}>
        <ForwardIcon />
        <span>Forward</span>
      </SubmitButton>
      {state?.error ? <div className="subtle error-text irip-forward-status">{state.error}</div> : null}
      {state?.success ? <div className="subtle success-text irip-forward-status">{state.success}</div> : null}
    </form>
  );
}

export default function IripChecklist({
  students,
  records,
  section,
  defaultTutorName,
  action,
  forwardAction
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
  const weekGroups = useMemo(() => {
    const groups = [];

    rows.forEach((row, index) => {
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.week !== row.week) {
        groups.push({
          week: row.week,
          items: [{ row, index }]
        });
        return;
      }

      lastGroup.items.push({ row, index });
    });

    return groups;
  }, [rows]);

  function updateRow(index, key, value) {
    setRows((current) =>
      current.map((row, rowIndex) => (
        rowIndex === index
          ? { ...row, [key]: value }
          : row
      ))
    );
  }

  return (
    <section className="table-card irip-shell">
      <div className="nav-strip">
        <div>
          <h2 style={{ marginBottom: 8 }}>IRIP Checklist</h2>
          <p className="lead">
            Individual Reading Intervention Plan checklist with weekly subskills, saved export files, and a direct forward-to-admin action.
          </p>
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

        <div className="irip-learner-directory no-print">
          <div className="irip-learner-directory-head">
            <strong>Learners</strong>
            <span className="subtle">Select a learner to edit. Saved checklists can be exported as DOCX or PDF, then forwarded to the admin inbox.</span>
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
                const hasSavedChecklist = savedCount > 0 || (
                  Array.isArray(savedRecord?.rows) &&
                  savedRecord.rows.some((row) => row?.notes)
                );

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

                    <div className="irip-learner-actions">
                      {hasSavedChecklist ? (
                        <a
                          href={`/api/teacher/irip/${student.id}/docx`}
                          className={`irip-action-button ${isSelected ? 'button' : 'button-secondary'}`}
                          aria-label={`Download IRIP DOCX for ${formatStudentName(student)}`}
                          title={`Download IRIP DOCX for ${formatStudentName(student)}`}
                        >
                          <DownloadIcon />
                          <span>DOCX</span>
                        </a>
                      ) : (
                        <span className="button-secondary irip-action-button is-disabled">
                          <DownloadIcon />
                          <span>DOCX</span>
                        </span>
                      )}

                      {hasSavedChecklist ? (
                        <a
                          href={`/api/teacher/irip/${student.id}/pdf`}
                          className="button-secondary irip-action-button"
                          aria-label={`Save IRIP PDF for ${formatStudentName(student)}`}
                          title={`Save IRIP PDF for ${formatStudentName(student)}`}
                        >
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="button-secondary irip-action-button is-disabled">
                          <span>PDF</span>
                        </span>
                      )}

                      <IripForwardForm
                        action={forwardAction}
                        studentId={student.id}
                        disabled={!hasSavedChecklist}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form action={formAction} className="form-grid">
          {state?.error ? <div className="banner error">{state.error}</div> : null}
          {state?.success ? <div className="banner success">{state.success}</div> : null}

          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="rows" value={JSON.stringify(rows)} />

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

          <div className="irip-week-groups">
            {weekGroups.map((group) => (
              <section key={group.week} className="irip-week-section">
                <div className="irip-week-section-head">
                  <span className="irip-week-badge">{group.week}</span>
                  <div>
                    <strong>{`Week ${group.week}`}</strong>
                    <div className="subtle">{group.items.length} subskills</div>
                  </div>
                </div>

                <div className="irip-week-table-wrap">
                  <table className="table irip-table irip-week-table">
                    <thead>
                      <tr>
                        <th>Reading Subskill</th>
                        <th style={{ width: 180 }}>Status</th>
                        <th style={{ width: '32%' }}>Tutor Notes / Observations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(({ row, index }) => (
                        <tr key={`${row.week}-${row.skill}`}>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
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

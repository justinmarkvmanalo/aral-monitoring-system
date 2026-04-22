'use client';

import { useActionState } from 'react';

import SubmitButton from '@/components/SubmitButton';

function priorityFromFlag(flag) {
  if (flag.concern_area === 'Attendance' && Number(flag.metric) >= 5) return 'High';
  if (flag.concern_area === 'Science' && Number(flag.metric) < 50) return 'High';
  if (flag.concern_area === 'Reading') return 'Medium';
  return 'Medium';
}

export default function InterventionTracker({ students, flags, records, action }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <section className="table-card">
      <div className="nav-strip" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Intervention Tracker</h2>
          <p className="lead">Combines teacher-entered intervention notes with live support flags derived from attendance, reading, and science performance.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Priority Flags</h3>
          {flags.length === 0 ? (
            <div className="subtle">No automatic intervention flags right now.</div>
          ) : (
            <div className="page-grid">
              {flags.map((flag, index) => (
                <div key={`${flag.student_id}-${flag.concern_area}-${index}`} className="metric-card">
                  <h3>{flag.last_name}, {flag.first_name}</h3>
                  <strong>{flag.concern_area}</strong>
                  <span>
                    {flag.concern_area === 'Attendance'
                      ? `${flag.metric} absences this month`
                      : flag.concern_area === 'Science'
                        ? `${flag.metric}% average`
                        : 'Recent level needs support'} | {priorityFromFlag(flag)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h3>Add Intervention Note</h3>
          <form action={formAction} className="form-grid">
            {state?.error ? <div className="banner error">{state.error}</div> : null}
            {state?.success ? <div className="banner success">{state.success}</div> : null}
            <div className="field">
              <label>Student</label>
              <select name="studentId" defaultValue="">
                <option value="" disabled>Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.last_name}, {student.first_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="two-col">
              <div className="field">
                <label>Concern Area</label>
                <select name="concernArea" defaultValue="Reading">
                  <option value="Reading">Reading</option>
                  <option value="Numeracy">Numeracy</option>
                  <option value="Science">Science</option>
                  <option value="Attendance">Attendance</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select name="priority" defaultValue="Medium">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Status</label>
              <select name="status" defaultValue="Open">
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea name="notes" rows={4} placeholder="Describe the intervention strategy or observation..." />
            </div>
            <SubmitButton>Save Intervention</SubmitButton>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>Recorded Interventions</h3>
        {records.length === 0 ? (
          <div className="subtle">No intervention records yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Concern</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.last_name}, {record.first_name}</td>
                    <td>{record.concern_area}</td>
                    <td>{record.priority}</td>
                    <td>{record.status}</td>
                    <td className="subtle">{record.notes}</td>
                    <td>{new Date(record.created_at).toLocaleDateString('en-PH')}</td>
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

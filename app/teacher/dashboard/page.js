import Link from 'next/link';
import { redirect } from 'next/navigation';

import { addStudentAction, saveAttendanceAction, teacherLogoutAction } from '@/app/actions';
import AddStudentForm from '@/components/AddStudentForm';
import AttendanceControls from '@/components/AttendanceControls';
import SubmitButton from '@/components/SubmitButton';
import { requireRole } from '@/lib/auth';
import { getTeacherDashboardData } from '@/lib/data';

function buildAttendanceLookup(attendanceRows) {
  const map = new Map();
  for (const row of attendanceRows) {
    map.set(`${row.student_id}:${row.session_date}`, row.status);
  }
  return map;
}

export default async function TeacherDashboardPage() {
  const session = await requireRole('teacher');
  const data = await getTeacherDashboardData(session.userId);

  if (!data.section) {
    redirect('/teacher/setup');
  }

  const addStudent = addStudentAction.bind(null, session);
  const saveAttendance = saveAttendanceAction.bind(null, session);
  const attendanceLookup = buildAttendanceLookup(data.attendance);

  return (
    <main className="shell">
      <div className="container page-grid">
        <div className="nav-strip">
          <div>
            <div className="brand">
              <div className="brand-mark">A</div>
              <div>ARAL Monitor</div>
            </div>
            <h1 style={{ marginBottom: 8 }}>Teacher Dashboard</h1>
            <div className="subtle">
              Grade {data.section.grade_level} | {data.section.section_name} | Welcome, {session.name}
            </div>
          </div>
          <div className="actions">
            <Link className="button-secondary" href="/teacher/setup">Edit Section</Link>
            <form action={teacherLogoutAction}>
              <SubmitButton className="button-secondary">Log Out</SubmitButton>
            </form>
          </div>
        </div>

        <section className="four-col">
          <div className="metric-card">
            <h3>Total Learners</h3>
            <strong>{data.stats.totalStudents}</strong>
            <span>Active in this section</span>
          </div>
          <div className="metric-card">
            <h3>Present Today</h3>
            <strong>{data.stats.presentToday}</strong>
            <span>Marked present</span>
          </div>
          <div className="metric-card">
            <h3>Absent Today</h3>
            <strong>{data.stats.absentToday}</strong>
            <span>Needs follow-up</span>
          </div>
          <div className="metric-card">
            <h3>Late Today</h3>
            <strong>{data.stats.lateToday}</strong>
            <span>Current session</span>
          </div>
        </section>

        <section className="two-col">
          <div className="panel">
            <h2>Add Student</h2>
            <p className="lead">Register a learner directly into your assigned section.</p>
            <AddStudentForm action={addStudent} sectionId={data.section.id} />
          </div>

          <div className="panel">
            <h2>Announcements</h2>
            <p className="lead">Recent updates from the school administrator.</p>
            <div className="page-grid">
              {data.announcements.length === 0 ? (
                <div className="subtle">No announcements yet.</div>
              ) : (
                data.announcements.map((announcement) => (
                  <div key={announcement.id} className="table-card">
                    <strong>{announcement.title}</strong>
                    <p className="lead" style={{ marginTop: 8, marginBottom: 8 }}>{announcement.message}</p>
                    <div className="subtle">
                      {new Date(announcement.created_at).toLocaleString('en-PH')}
                      {announcement.admin_name ? ` | ${announcement.admin_name}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="table-card">
          <h2>Weekly Attendance</h2>
          <p className="lead">Use the controls in each date column to set attendance.</p>

          {data.students.length === 0 ? (
            <div className="subtle">No students yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>LRN</th>
                    {data.weekDates.map((date) => (
                      <th key={date}>{new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.last_name}, {student.first_name}</strong>
                        <div className="subtle">{student.gender || 'Unspecified'}</div>
                      </td>
                      <td>{student.lrn}</td>
                      {data.weekDates.map((date) => (
                        <td key={date}>
                          <AttendanceControls
                            action={saveAttendance}
                            studentId={student.id}
                            sessionDate={date}
                            currentStatus={attendanceLookup.get(`${student.id}:${date}`) || ''}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="three-col">
          <div className="panel">
            <h2>Reading Tracker</h2>
            <p className="lead">The detailed Phil-IRI assessor is not ported yet. This Vercel rebuild currently covers the core operational flows first.</p>
            <span className="pill amber">Pending Module Port</span>
          </div>
          <div className="panel">
            <h2>Numeracy Practice</h2>
            <p className="lead">The original drill generator is not ported yet. The database structure remains ready for a later Next.js module.</p>
            <span className="pill amber">Pending Module Port</span>
          </div>
          <div className="panel">
            <h2>Science & Interventions</h2>
            <p className="lead">These pages can be added after the Vercel deployment path is stable.</p>
            <span className="pill amber">Pending Module Port</span>
          </div>
        </section>
      </div>
    </main>
  );
}

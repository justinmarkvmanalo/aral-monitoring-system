import {
  adminLogoutAction,
  addAnnouncementAction,
  addTeacherAction,
  deleteAnnouncementAction,
  deleteTeacherAction
} from '@/app/actions';
import {
  AddAnnouncementForm,
  AddTeacherForm,
  DeleteAnnouncementForm,
  DeleteTeacherForm
} from '@/components/AdminForms';
import SubmitButton from '@/components/SubmitButton';
import { requireRole } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/data';

export default async function AdminDashboardPage() {
  const session = await requireRole('admin');
  const data = await getAdminDashboardData();
  const addTeacher = addTeacherAction;
  const addAnnouncement = addAnnouncementAction.bind(null, session);
  const deleteTeacher = deleteTeacherAction;
  const deleteAnnouncement = deleteAnnouncementAction;

  return (
    <main className="shell">
      <div className="container page-grid">
        <div className="nav-strip">
          <div>
            <div className="brand">
              <div className="brand-mark">A</div>
              <div>ARAL Monitor</div>
            </div>
            <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
            <div className="subtle">Welcome, {session.name}</div>
          </div>
          <form action={adminLogoutAction}>
            <SubmitButton className="button-secondary">Log Out</SubmitButton>
          </form>
        </div>

        <section className="four-col">
          <div className="metric-card">
            <h3>Total Teachers</h3>
            <strong>{data.teachers.length}</strong>
            <span>Registered accounts</span>
          </div>
          <div className="metric-card">
            <h3>Total Sections</h3>
            <strong>{data.sections.length}</strong>
            <span>Active class sections</span>
          </div>
          <div className="metric-card">
            <h3>Total Students</h3>
            <strong>{data.totalStudents}</strong>
            <span>School-wide active learners</span>
          </div>
          <div className="metric-card">
            <h3>Attendance Today</h3>
            <strong>{data.attendanceSummary.P}</strong>
            <span>
              P: {data.attendanceSummary.P} | A: {data.attendanceSummary.A} | L: {data.attendanceSummary.L} | U:{' '}
              {data.unmarkedToday}
            </span>
          </div>
        </section>

        <section className="two-col">
          <div className="panel">
            <h2>Add Teacher</h2>
            <p className="lead">Create a teacher account directly from the admin panel.</p>
            <AddTeacherForm action={addTeacher} />
          </div>

          <div className="panel">
            <h2>Post Announcement</h2>
            <p className="lead">Announcements appear on the teacher dashboard.</p>
            <AddAnnouncementForm action={addAnnouncement} />
          </div>
        </section>

        <section className="two-col">
          <div className="table-card">
            <h2>Teachers</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Section</th>
                    <th>Learners</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.full_name}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.section_name || 'Unassigned'}</td>
                      <td>{teacher.student_count}</td>
                      <td>
                        <DeleteTeacherForm action={deleteTeacher} teacherId={teacher.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card">
            <h2>Sections</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Grade</th>
                    <th>School Year</th>
                    <th>Teacher</th>
                    <th>Learners</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sections.map((section) => (
                    <tr key={section.id}>
                      <td>{section.section_name}</td>
                      <td>{section.grade_level}</td>
                      <td>{section.school_year_label || 'Not set'}</td>
                      <td>{section.teacher_name || 'Unassigned'}</td>
                      <td>{section.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="table-card">
          <h2>Section Attendance Today</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.sectionAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="subtle">No section attendance data yet.</td>
                  </tr>
                ) : (
                  data.sectionAttendance.map((section) => (
                    <tr key={section.id}>
                      <td>Grade {section.grade_level} | {section.section_name}</td>
                      <td>{section.present}</td>
                      <td>{section.absent}</td>
                      <td>{section.late}</td>
                      <td>{section.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-card">
          <h2>Attendance Interventions</h2>
          <p className="lead">Students with 3 or more absences this month.</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Section</th>
                  <th>Teacher</th>
                  <th>Absences</th>
                </tr>
              </thead>
              <tbody>
                {data.interventions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="subtle">No intervention cases right now.</td>
                  </tr>
                ) : (
                  data.interventions.map((student) => (
                    <tr key={student.id}>
                      <td>{student.last_name}, {student.first_name}</td>
                      <td>{student.section_name}</td>
                      <td>{student.teacher_name || 'Unassigned'}</td>
                      <td>{student.absence_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-card">
          <h2>Recent Announcements</h2>
          <div className="page-grid">
            {data.announcements.length === 0 ? (
              <div className="subtle">No announcements yet.</div>
            ) : (
              data.announcements.map((announcement) => (
                <div key={announcement.id} className="panel">
                  <div className="inline-actions" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong>{announcement.title}</strong>
                      <p className="lead" style={{ marginTop: 8, marginBottom: 8 }}>{announcement.message}</p>
                      <div className="subtle">{new Date(announcement.created_at).toLocaleString('en-PH')}</div>
                    </div>
                    <DeleteAnnouncementForm action={deleteAnnouncement} announcementId={announcement.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

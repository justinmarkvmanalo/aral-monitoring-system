'use client';

import { useState } from 'react';
import { TopNav, Sidebar } from '@/components/Navigation';
import {
  AddAnnouncementForm,
  AddTeacherForm,
  DeleteAnnouncementForm,
  DeleteTeacherForm
} from '@/components/AdminForms';

export default function AdminDashboardClient({ 
  session, 
  data, 
  actions 
}) {
  const [activeItem, setActiveItem] = useState('overview');

  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>Admin Dashboard</h1>
              <p>Welcome, {session.name}</p>
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
                <AddTeacherForm action={actions.addTeacher} />
              </div>

              <div className="panel">
                <h2>Post Announcement</h2>
                <p className="lead">Announcements appear on the teacher dashboard.</p>
                <AddAnnouncementForm action={actions.addAnnouncement} />
              </div>
            </section>
          </div>
        );

      case 'teachers':
        return (
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
                        <DeleteTeacherForm action={actions.deleteTeacher} teacherId={teacher.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sections':
        return (
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
        );

      case 'attendance':
        return (
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
        );

      case 'interventions':
        return (
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
        );

      case 'announcements':
        return (
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
                      <DeleteAnnouncementForm action={actions.deleteAnnouncement} announcementId={announcement.id} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        );

      case 'reports':
        return (
          <div className="panel">
            <h2>School Reports</h2>
            <p>School-wide analytics and export features will be available here.</p>
          </div>
        );

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <div id="app">
      <TopNav user={session} role="admin" />
      <div className="main-wrap">
        <Sidebar 
          role="admin" 
          activeItem={activeItem} 
          onNavigate={setActiveItem} 
          counts={{ 
            teachers: data.teachers.length,
            sections: data.sections.length,
            interventions: data.interventions.length 
          }} 
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

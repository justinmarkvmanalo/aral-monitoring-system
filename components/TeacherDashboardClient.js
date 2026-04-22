'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopNav, Sidebar } from '@/components/Navigation';
import AddStudentForm from '@/components/AddStudentForm';
import AttendanceControls from '@/components/AttendanceControls';
import InterventionTracker from '@/components/InterventionTracker';
import NumeracyPractice from '@/components/NumeracyPractice';
import ReadingTracker from '@/components/ReadingTracker';
import ScienceTracker from '@/components/ScienceTracker';
import SubmitButton from '@/components/SubmitButton';

export default function TeacherDashboardClient({ 
  session, 
  data, 
  actions,
  attendanceLookup 
}) {
  const [activeItem, setActiveItem] = useState('dashboard');

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>Teacher Dashboard</h1>
              <p>Grade {data.section.grade_level} | {data.section.section_name} | Welcome, {session.name}</p>
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
                <AddStudentForm action={actions.addStudent} sectionId={data.section.id} />
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
          </div>
        );

      case 'attendance':
        return (
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
                              action={actions.saveAttendance}
                              studentId={student.id}
                              sessionDate={date}
                              currentStatus={attendanceLookup[student.id + ':' + date] || ''}
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
        );

      case 'reading':
        return (
          <ReadingTracker
            students={data.students}
            assessments={data.reading.assessments}
            action={actions.saveReadingAssessment}
          />
        );

      case 'numeracy':
        return (
          <NumeracyPractice
            sectionId={data.section.id}
            students={data.students}
            initialDrill={data.numeracy.latestDrill}
            initialScores={data.numeracy.scores}
            saveDrillAction={actions.saveNumeracyDrill}
            saveScoresAction={actions.saveNumeracyScores}
          />
        );

      case 'science':
        return (
          <ScienceTracker
            sectionId={data.section.id}
            students={data.students}
            summary={data.science.summary}
            scores={data.science.scores}
            action={actions.saveScienceQuiz}
          />
        );

      case 'intervention':
        return (
          <InterventionTracker
            students={data.students}
            flags={data.interventions.flags}
            records={data.interventions.records}
            action={actions.saveIntervention}
          />
        );

      case 'reports':
        return (
          <div className="panel">
            <h2>Auto Reports</h2>
            <p>Reports and analytics will be available here.</p>
          </div>
        );

      case 'announcements':
        return (
          <div className="panel">
            <h2>Announcements</h2>
            <div className="page-grid">
              {data.announcements.map((announcement) => (
                <div key={announcement.id} className="table-card">
                  <strong>{announcement.title}</strong>
                  <p className="lead" style={{ marginTop: 8, marginBottom: 8 }}>{announcement.message}</p>
                  <div className="subtle">
                    {new Date(announcement.created_at).toLocaleString('en-PH')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <>
      <TopNav user={session} role="teacher" />
      <div className="main-wrap">
        <Sidebar 
          role="teacher" 
          activeItem={activeItem} 
          onNavigate={setActiveItem} 
          counts={{ 
            students: data.stats.totalStudents,
            interventions: data.interventions.records.filter(r => r.status === 'active').length 
          }} 
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

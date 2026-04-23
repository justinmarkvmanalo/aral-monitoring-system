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
  const openInterventions = data.interventions.records.filter(
    (record) => record.status === 'Open' || record.status === 'In Progress'
  ).length;
  const readingNeedsSupport = data.reading.assessments.filter(
    (assessment) => assessment.level !== 'Independent'
  ).length;
  const scienceNeedsReview = data.science.summary.reduce(
    (total, entry) => total + Number(entry.needs_review || 0),
    0
  );
  const attendanceMarked = data.stats.presentToday + data.stats.absentToday + data.stats.lateToday;
  const attendanceRate = data.stats.totalStudents
    ? Math.round((data.stats.presentToday / data.stats.totalStudents) * 100)
    : 0;

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
          <div className="page-grid">
            <div className="page-header">
              <h1>Auto Reports</h1>
              <p>Live section summaries based on the same attendance and learner tracking data used in the dashboard.</p>
            </div>

            <section className="four-col">
              <div className="metric-card">
                <h3>Attendance Rate</h3>
                <strong>{attendanceRate}%</strong>
                <span>{attendanceMarked} learner records marked today</span>
              </div>
              <div className="metric-card">
                <h3>Reading Support</h3>
                <strong>{readingNeedsSupport}</strong>
                <span>Assessments below Independent level</span>
              </div>
              <div className="metric-card">
                <h3>Science Review</h3>
                <strong>{scienceNeedsReview}</strong>
                <span>Learner results below the pass threshold</span>
              </div>
              <div className="metric-card">
                <h3>Open Cases</h3>
                <strong>{openInterventions}</strong>
                <span>Interventions still requiring follow-up</span>
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <h2>Submission Snapshot</h2>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>School Year</th>
                      <td>{data.section.school_year_label || 'Not set'}</td>
                    </tr>
                    <tr>
                      <th>Section</th>
                      <td>Grade {data.section.grade_level} | {data.section.section_name}</td>
                    </tr>
                    <tr>
                      <th>Total Learners</th>
                      <td>{data.stats.totalStudents}</td>
                    </tr>
                    <tr>
                      <th>Latest Numeracy Drill</th>
                      <td>{data.numeracy.latestDrill?.label || data.numeracy.latestDrill?.skill_name || 'No saved drill yet'}</td>
                    </tr>
                    <tr>
                      <th>Latest Science Check</th>
                      <td>{data.science.summary[0] ? `${data.science.summary[0].topic_name} (${data.science.summary[0].quiz_date})` : 'No quiz yet'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <h2>Priority Learners</h2>
                {data.interventions.flags.length === 0 ? (
                  <div className="subtle">No automatic flags right now.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Concern</th>
                          <th>Metric</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.interventions.flags.slice(0, 8).map((flag, index) => (
                          <tr key={`${flag.student_id}-${flag.concern_area}-${index}`}>
                            <td>{flag.last_name}, {flag.first_name}</td>
                            <td>{flag.concern_area}</td>
                            <td>
                              {flag.concern_area === 'Attendance'
                                ? `${flag.metric} absences`
                                : flag.concern_area === 'Science'
                                  ? `${flag.metric}% average`
                                  : 'Needs support'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
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
      <TopNav user={session} role="teacher" schoolYearLabel={data.section.school_year_label} />
      <div className="main-wrap">
        <Sidebar 
          role="teacher" 
          activeItem={activeItem} 
          onNavigate={setActiveItem} 
          counts={{ 
            students: data.stats.totalStudents,
            interventions: openInterventions
          }} 
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

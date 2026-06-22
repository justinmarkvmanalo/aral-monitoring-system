'use client';

import { useEffect, useMemo, useState } from 'react';
import { TopNav, Sidebar } from '@/components/Navigation';
import AddStudentForm from '@/components/AddStudentForm';
import AttendanceControls from '@/components/AttendanceControls';
import ReadingTracker from '@/components/ReadingTracker';
import { formatDateOnly, formatDateTime, formatMonthDay } from '@/lib/date';

export default function TeacherDashboardClient({ 
  session, 
  data, 
  actions,
  attendanceLookup 
}) {
  const [activeItem, setActiveItem] = useState('dashboard');
  const attendanceWeeks = data.attendanceWeeks || [];
  const defaultAttendanceWeek = Math.min(
    data.currentAttendanceWeekIndex || 0,
    Math.max(attendanceWeeks.length - 1, 0)
  );
  const [selectedAttendanceWeek, setSelectedAttendanceWeek] = useState(defaultAttendanceWeek);
  const latestReadingAssessments = useMemo(() => {
    const latestByStudent = new Map();

    data.reading.assessments.forEach((assessment) => {
      if (!latestByStudent.has(assessment.student_id)) {
        latestByStudent.set(assessment.student_id, assessment);
      }
    });

    return Array.from(latestByStudent.values());
  }, [data.reading.assessments]);
  const readingNeedsSupport = latestReadingAssessments.filter(
    (assessment) => assessment.level !== 'Independent'
  ).length;
  const readingAssessedLearners = latestReadingAssessments.length;
  const attendanceFollowUp = data.stats.absentToday + data.stats.lateToday;
  const attendanceMarked = data.stats.presentToday + data.stats.absentToday + data.stats.lateToday;
  const attendanceRate = data.stats.totalStudents
    ? Math.round((data.stats.presentToday / data.stats.totalStudents) * 100)
    : 0;
  const currentAttendanceWeek = attendanceWeeks[selectedAttendanceWeek] || attendanceWeeks[0] || null;

  const philIriQst = useMemo(() => {
    const male = { enrollment: 0, pupilsTested: 0, oralFrustration: 0, oralInstructional: 0, oralIndependent: 0, compFrustration: 0, compInstructional: 0, compIndependent: 0, readingFrustration: 0, readingInstructional: 0, readingIndependent: 0 };
    const female = { enrollment: 0, pupilsTested: 0, oralFrustration: 0, oralInstructional: 0, oralIndependent: 0, compFrustration: 0, compInstructional: 0, compIndependent: 0, readingFrustration: 0, readingInstructional: 0, readingIndependent: 0 };

    const readingMap = new Map();
    data.reading.assessments.forEach((a) => {
      if (!readingMap.has(a.student_id)) readingMap.set(a.student_id, a);
    });

    const comprehensionMap = new Map();
    data.comprehension.assessments.forEach((a) => {
      if (!comprehensionMap.has(a.student_id)) comprehensionMap.set(a.student_id, a);
    });

    for (const student of data.students) {
      const g = student.gender === 'M' ? male : female;
      g.enrollment += 1;

      const reading = readingMap.get(student.id);
      if (reading) {
        g.pupilsTested += 1;
        if (reading.level === 'Frustration') g.oralFrustration += 1;
        else if (reading.level === 'Instructional') g.oralInstructional += 1;
        else if (reading.level === 'Independent') g.oralIndependent += 1;
      }

      const comprehension = comprehensionMap.get(student.id);
      if (comprehension) {
        if (comprehension.level === 'Frustration') g.compFrustration += 1;
        else if (comprehension.level === 'Instructional') g.compInstructional += 1;
        else if (comprehension.level === 'Independent') g.compIndependent += 1;
      }

      const oralLevel = reading?.level;
      const compLevel = comprehension?.level;

      if (oralLevel === 'Frustration' || compLevel === 'Frustration') {
        g.readingFrustration += 1;
      } else if (oralLevel === 'Independent' && compLevel === 'Independent') {
        g.readingIndependent += 1;
      } else if (oralLevel || compLevel) {
        g.readingInstructional += 1;
      }
    }

    return { male, female };
  }, [data.students, data.reading.assessments, data.comprehension.assessments]);

  const supportGraphItems = [
    {
      label: 'Attendance Follow-up',
      value: attendanceFollowUp,
      detail: 'Absent or late today',
      tone: 'amber'
    },
    {
      label: 'Reading Support',
      value: readingNeedsSupport,
      detail: 'Latest result below Independent',
      tone: 'red'
    },
    {
      label: 'Learners Assessed',
      value: readingAssessedLearners,
      detail: 'Saved oral reading results',
      tone: 'green'
    }
  ];
  const supportGraphMax = Math.max(data.stats.totalStudents || 0, ...supportGraphItems.map((item) => item.value), 1);

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
                <h3>Learners Assessed</h3>
                <strong>{readingAssessedLearners}</strong>
                <span>Latest oral reading results saved</span>
              </div>
            </section>

            <section className="panel">
              <div className="nav-strip" style={{ marginBottom: 16 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>Learner Support Graph</h2>
                  <p className="lead" style={{ margin: 0 }}>A quick view of how many learners currently need follow-up across the main support areas.</p>
                </div>
                <div className="subtle">Scale: out of {data.stats.totalStudents || 0} learners</div>
              </div>
              <div className="support-chart">
                {supportGraphItems.map((item) => {
                  const widthPct = item.value > 0 ? Math.max(8, Math.round((item.value / supportGraphMax) * 100)) : 0;
                  return (
                    <div key={item.label} className="support-chart-row">
                      <div className="support-chart-label">
                        <strong>{item.label}</strong>
                        <span className="subtle">{item.detail}</span>
                      </div>
                      <div className="support-chart-track" aria-hidden="true">
                        <div className={`support-chart-bar ${item.tone}`} style={{ width: `${widthPct}%` }} />
                      </div>
                      <div className="support-chart-value">{item.value}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <h2>Class Snapshot</h2>
                <p className="lead">A quick summary of the active section you are handling today.</p>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Section</th>
                      <td>Grade {data.section.grade_level} | {data.section.section_name}</td>
                    </tr>
                    <tr>
                      <th>School Year</th>
                      <td>{data.section.school_year_label || 'Not set'}</td>
                    </tr>
                    <tr>
                      <th>Total Learners</th>
                      <td>{data.stats.totalStudents}</td>
                    </tr>
                    <tr>
                      <th>Attendance Follow-up</th>
                      <td>{attendanceFollowUp}</td>
                    </tr>
                  </tbody>
                </table>
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
                          {formatDateTime(announcement.created_at)}
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

      case 'students':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>Students</h1>
              <p>Add learners to your section and review the current class list.</p>
            </div>

            <section className="two-col">
              <div className="panel">
                <h2>Add Student</h2>
                <p className="lead">Register a learner directly into your assigned section.</p>
                <AddStudentForm action={actions.addStudent} sectionId={data.section.id} />
              </div>

              <div className="panel">
                <h2>Current Learners</h2>
                {data.students.length === 0 ? (
                  <div className="subtle">No students added yet.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>LRN</th>
                          <th>Gender</th>
                          <th>Birth Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.students.map((student) => (
                          <tr key={student.id}>
                            <td>{student.last_name}, {student.first_name}{student.middle_name ? ` ${student.middle_name}` : ''}</td>
                            <td>{student.lrn}</td>
                            <td>{student.gender || '-'}</td>
                            <td>{student.birth_date ? formatDateOnly(student.birth_date) : '-'}</td>
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

      case 'attendance':
        return (
          <section className="table-card">
            <h2>10-Week Attendance</h2>
            <p className="lead">Switch between the scheduled weeks starting from today and use the controls in each date column to set attendance.</p>
            {currentAttendanceWeek ? (
              <div className="actions" style={{ alignItems: 'end', marginTop: 20, marginBottom: 20 }}>
                <div className="field" style={{ minWidth: 240, maxWidth: 320 }}>
                  <label htmlFor="attendance-week">Attendance Week</label>
                  <select
                    id="attendance-week"
                    value={selectedAttendanceWeek}
                    onChange={(event) => setSelectedAttendanceWeek(Number(event.target.value))}
                  >
                    {attendanceWeeks.map((week) => (
                      <option key={week.index} value={week.index}>
                        {week.label} | {week.rangeLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="subtle">{currentAttendanceWeek.rangeLabel}</div>
              </div>
            ) : null}
            {data.students.length === 0 ? (
              <div className="subtle">No students yet.</div>
            ) : !currentAttendanceWeek ? (
              <div className="subtle">No attendance weeks available yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>LRN</th>
                      {currentAttendanceWeek.dates.map((date) => (
                        <th key={date}>{formatMonthDay(date)}</th>
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
                        {currentAttendanceWeek.dates.map((date) => (
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
            saveComprehensionAction={actions.saveComprehensionAssessment}
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
                <h3>Attendance Follow-up</h3>
                <strong>{attendanceFollowUp}</strong>
                <span>Absent or late today</span>
              </div>
              <div className="metric-card">
                <h3>Reading Support</h3>
                <strong>{readingNeedsSupport}</strong>
                <span>Latest reading results needing support</span>
              </div>
            </section>

            <section className="panel" style={{ overflowX: 'auto' }}>
              <h2>Phil-IRI QST Report</h2>
              <p className="lead">Aggregated reading profile by gender based on saved oral reading and comprehension results.</p>
              <table className="table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Male</th>
                    <th style={{ textAlign: 'center' }}>Female</th>
                    <th style={{ textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Enrollment</strong></td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.enrollment}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.enrollment}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.enrollment + philIriQst.female.enrollment}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Pupils Tested (Oral Reading)</strong></td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.pupilsTested}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.pupilsTested}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.pupilsTested + philIriQst.female.pupilsTested}</strong></td>
                  </tr>
                  <tr style={{ backgroundColor: '#fef3c7' }}>
                    <td colSpan={4}><strong>Oral Reading Word Recognition</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Frustration</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.oralFrustration}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.oralFrustration}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.oralFrustration + philIriQst.female.oralFrustration}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Instructional</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.oralInstructional}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.oralInstructional}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.oralInstructional + philIriQst.female.oralInstructional}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Independent</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.oralIndependent}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.oralIndependent}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.oralIndependent + philIriQst.female.oralIndependent}</strong></td>
                  </tr>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    <td colSpan={4}><strong>Reading Comprehension</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Frustration</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.compFrustration}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.compFrustration}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.compFrustration + philIriQst.female.compFrustration}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Instructional</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.compInstructional}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.compInstructional}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.compInstructional + philIriQst.female.compInstructional}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Independent</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.compIndependent}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.compIndependent}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.compIndependent + philIriQst.female.compIndependent}</strong></td>
                  </tr>
                  <tr style={{ backgroundColor: '#bbf7d0' }}>
                    <td colSpan={4}><strong>Overall Reading Level</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Frustration</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.readingFrustration}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.readingFrustration}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.readingFrustration + philIriQst.female.readingFrustration}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Instructional</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.readingInstructional}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.readingInstructional}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.readingInstructional + philIriQst.female.readingInstructional}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 32 }}>Independent</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.male.readingIndependent}</td>
                    <td style={{ textAlign: 'center' }}>{philIriQst.female.readingIndependent}</td>
                    <td style={{ textAlign: 'center' }}><strong>{philIriQst.male.readingIndependent + philIriQst.female.readingIndependent}</strong></td>
                  </tr>
                </tbody>
              </table>
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
                      <th>Reading Assessments Saved</th>
                      <td>{data.reading.assessments.length}</td>
                    </tr>
                    <tr>
                      <th>Learners Assessed</th>
                      <td>{readingAssessedLearners}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <h2>Latest Reading Status</h2>
                {latestReadingAssessments.length === 0 ? (
                  <div className="subtle">No saved oral reading results yet.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Date</th>
                          <th>Level</th>
                          <th>Pronunciation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestReadingAssessments.slice(0, 8).map((assessment) => (
                          <tr key={assessment.id}>
                            <td>{assessment.last_name}, {assessment.first_name}</td>
                            <td>{formatDateOnly(assessment.assessed_date)}</td>
                            <td>{assessment.level}</td>
                            <td>{assessment.pronunciation}</td>
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
                    {formatDateTime(announcement.created_at)}
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
      <TopNav
        user={session}
        role="teacher"
        schoolYearLabel={data.section.school_year_label}
        logoutAction={actions.logout}
      />
      <div className="main-wrap">
        <Sidebar 
          role="teacher" 
          activeItem={activeItem} 
          onNavigate={setActiveItem} 
          counts={{ 
            students: data.stats.totalStudents
          }} 
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

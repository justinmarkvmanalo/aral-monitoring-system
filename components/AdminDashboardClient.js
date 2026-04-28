'use client';

import { useEffect, useState } from 'react';
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
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsStatus, setAiInsightsStatus] = useState('idle');
  const [aiInsightsError, setAiInsightsError] = useState('');
  const schoolYearLabel =
    data.sections.find((section) => section.school_year_label)?.school_year_label || 'School Year Not Set';
  const workload = data.workloadAnalytics;
  const attendanceMarked =
    data.attendanceSummary.P + data.attendanceSummary.A + data.attendanceSummary.L;
  const overviewGraphItems = [
    {
      label: 'Teachers',
      value: data.teachers.length,
      detail: 'Registered accounts',
      tone: 'blue'
    },
    {
      label: 'Sections',
      value: data.sections.length,
      detail: 'Active class sections',
      tone: 'blue'
    },
    {
      label: 'Learners',
      value: data.totalStudents,
      detail: 'School-wide active learners',
      tone: 'green'
    },
    {
      label: 'Present',
      value: data.attendanceSummary.P,
      detail: 'Marked present today',
      tone: 'green'
    },
    {
      label: 'Absent',
      value: data.attendanceSummary.A,
      detail: 'Marked absent today',
      tone: 'red'
    },
    {
      label: 'Late',
      value: data.attendanceSummary.L,
      detail: 'Marked late today',
      tone: 'amber'
    },
    {
      label: 'Unmarked',
      value: data.unmarkedToday,
      detail: 'Still waiting for status',
      tone: 'amber'
    }
  ];
  const overviewGraphMax = Math.max(1, ...overviewGraphItems.map((item) => item.value));

  useEffect(() => {
    if (activeItem !== 'reports' || aiInsightsStatus !== 'idle') {
      return;
    }

    let cancelled = false;

    async function loadAiInsights() {
      setAiInsightsStatus('loading');
      setAiInsightsError('');

      try {
        const response = await fetch('/api/admin/workload-insights', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load AI workload insights.');
        }

        if (!cancelled) {
          setAiInsights(payload);
          setAiInsightsStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          setAiInsightsError(error.message || 'Unable to load AI workload insights.');
          setAiInsightsStatus('error');
        }
      }
    }

    loadAiInsights();

    return () => {
      cancelled = true;
    };
  }, [activeItem, aiInsightsStatus]);

  function formatHours(value) {
    const numericValue = Number(value || 0);
    return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
  }

  function workloadPillClass(level) {
    if (level === 'High') return 'pill red';
    if (level === 'Moderate') return 'pill amber';
    return 'pill green';
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return (
          <div className="page-grid">
            <div className="page-header">
              <div className="inline-actions" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h1>Admin Dashboard</h1>
                  <p>Welcome, {session.name}</p>
                </div>
                <button type="button" className="button-secondary" onClick={() => setActiveItem('announcements')}>
                  Open Announcements
                </button>
              </div>
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

            <section className="panel">
              <div className="nav-strip" style={{ marginBottom: 16 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>Quick Actions</h2>
                  <p className="lead" style={{ margin: 0 }}>
                    Open the most common admin tasks directly from the dashboard.
                  </p>
                </div>
              </div>
              <div className="quick-action-grid">
                <button type="button" className="quick-action-card" onClick={() => setActiveItem('announcements')}>
                  <span className="quick-action-icon">AN</span>
                  <strong>Announcements</strong>
                  <span className="subtle">{data.announcements.length} posted updates</span>
                </button>
                <button type="button" className="quick-action-card" onClick={() => setActiveItem('teachers')}>
                  <span className="quick-action-icon">TC</span>
                  <strong>Teachers</strong>
                  <span className="subtle">{data.teachers.length} registered accounts</span>
                </button>
                <button type="button" className="quick-action-card" onClick={() => setActiveItem('irip')}>
                  <span className="quick-action-icon">IR</span>
                  <strong>IRIP Inbox</strong>
                  <span className="subtle">{data.iripForwards.length} forwarded learner files</span>
                </button>
                <button type="button" className="quick-action-card" onClick={() => setActiveItem('reports')}>
                  <span className="quick-action-icon">RP</span>
                  <strong>Reports</strong>
                  <span className="subtle">Open school workload analytics</span>
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="nav-strip" style={{ marginBottom: 16 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>School Numerical Graph</h2>
                  <p className="lead" style={{ margin: 0 }}>
                    Exact school counts and today&apos;s attendance marks in one quick graph.
                  </p>
                </div>
                <div className="subtle">{attendanceMarked} attendance records marked today</div>
              </div>
              <div className="numeric-graph-grid">
                {overviewGraphItems.map((item) => {
                  const widthPct = item.value > 0 ? Math.max(10, Math.round((item.value / overviewGraphMax) * 100)) : 0;
                  return (
                    <div key={item.label} className="numeric-graph-card">
                      <div className="numeric-graph-head">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div className="numeric-graph-track" aria-hidden="true">
                        <div className={`numeric-graph-fill ${item.tone}`} style={{ width: `${widthPct}%` }} />
                      </div>
                      <div className="subtle">{item.detail}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <h2>Add Teacher</h2>
                <p className="lead">Create a teacher account directly from the admin panel.</p>
                <AddTeacherForm action={actions.addTeacher} />
              </div>

              <div className="panel">
                <div className="nav-strip" style={{ marginBottom: 16 }}>
                  <div>
                    <h2 style={{ marginBottom: 8 }}>Post Announcement</h2>
                    <p className="lead" style={{ margin: 0 }}>Announcements appear on the teacher dashboard.</p>
                  </div>
                  <button type="button" className="button-secondary" onClick={() => setActiveItem('announcements')}>
                    Manage
                  </button>
                </div>
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

      case 'irip':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>IRIP Inbox</h1>
              <p>Teachers can forward saved IRIP files here for admin review and download.</p>
            </div>

            <section className="two-col">
              <div className="panel">
                <h2>Forwarded Files</h2>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Total Forwards</th>
                      <td>{data.iripForwards.length}</td>
                    </tr>
                    <tr>
                      <th>Source</th>
                      <td>Teacher IRIP checklist</td>
                    </tr>
                    <tr>
                      <th>Formats</th>
                      <td>PDF and DOCX</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <h2>Admin Use</h2>
                <p className="lead">Download the forwarded snapshot in the format you need for filing, review, or re-sharing.</p>
                <div className="subtle">
                  Each forwarded item keeps the learner name, grade level, tutor name, and saved checklist rows from the time it was sent.
                </div>
              </div>
            </section>

            <section className="table-card">
              <h2>Forwarded IRIP Files</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Section</th>
                      <th>Teacher</th>
                      <th>Grade Label</th>
                      <th>Forwarded</th>
                      <th>Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.iripForwards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="subtle">No forwarded IRIP files yet.</td>
                      </tr>
                    ) : (
                      data.iripForwards.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <strong>{record.learner_name}</strong>
                            <div className="subtle">{record.tutor_name}</div>
                          </td>
                          <td>
                            {record.section_name
                              ? `Grade ${record.section_grade_level} | ${record.section_name}`
                              : 'Section not available'}
                          </td>
                          <td>{record.teacher_name || 'Unknown teacher'}</td>
                          <td>{record.grade_level}</td>
                          <td>{new Date(record.forwarded_at).toLocaleString('en-PH')}</td>
                          <td>
                            <div className="inline-actions">
                              <a
                                href={`/api/admin/irip-forwards/${record.id}/docx`}
                                className="button-secondary"
                              >
                                DOCX
                              </a>
                              <a
                                href={`/api/admin/irip-forwards/${record.id}/pdf`}
                                className="button-secondary"
                              >
                                PDF
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );

      case 'announcements':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>Announcements</h1>
              <p>Send updates from the admin dashboard and they will appear on the teacher dashboard.</p>
            </div>

            <section className="two-col">
              <div className="panel">
                <h2>Send Announcement</h2>
                <p className="lead">Teachers will receive this on their dashboard and announcements screen.</p>
                <AddAnnouncementForm action={actions.addAnnouncement} submitLabel="Send Announcement" />
              </div>

              <div className="panel">
                <h2>Delivery Summary</h2>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Total Teachers</th>
                      <td>{data.teachers.length}</td>
                    </tr>
                    <tr>
                      <th>Posted Announcements</th>
                      <td>{data.announcements.length}</td>
                    </tr>
                    <tr>
                      <th>Visibility</th>
                      <td>Teacher dashboard and announcements page</td>
                    </tr>
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
                        <DeleteAnnouncementForm action={actions.deleteAnnouncement} announcementId={announcement.id} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        );

      case 'reports':
        return (
          <div className="page-grid">
            <div className="page-header">
              <h1>School Reports</h1>
              <p>School-wide reporting is now integrated with live teacher, section, attendance, intervention, and workload analytics.</p>
            </div>

            <section className="four-col">
              <div className="metric-card">
                <h3>Learners Tracked</h3>
                <strong>{workload.totals.learners}</strong>
                <span>Total learners assigned across teachers</span>
              </div>
              <div className="metric-card">
                <h3>Intervention Hours</h3>
                <strong>{formatHours(workload.totals.interventionHours)}</strong>
                <span>Estimated from recorded intervention logs</span>
              </div>
              <div className="metric-card">
                <h3>Learners Needing Escalation</h3>
                <strong>{workload.totals.escalationLearners}</strong>
                <span>Attendance, reading, science, or high-priority cases</span>
              </div>
              <div className="metric-card">
                <h3>Overload Alerts</h3>
                <strong>{workload.totals.overloadedTeachers}</strong>
                <span>Teachers currently marked Moderate or High</span>
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <h2>AI Workload Brief</h2>
                <p className="lead">{workload.estimationNote}</p>
                {aiInsightsStatus === 'loading' ? (
                  <div className="subtle">Generating AI workload summary...</div>
                ) : aiInsightsStatus === 'error' ? (
                  <div className="banner error" style={{ marginBottom: 0 }}>{aiInsightsError}</div>
                ) : aiInsights ? (
                  <div className="page-grid">
                    <div>
                      <strong>{aiInsights.headline}</strong>
                      <p className="lead" style={{ marginTop: 8, marginBottom: 0 }}>{aiInsights.summary}</p>
                    </div>
                    <div>
                      <strong>Alerts</strong>
                      {aiInsights.alerts.length === 0 ? (
                        <div className="subtle" style={{ marginTop: 8 }}>No AI alerts returned.</div>
                      ) : (
                        <div className="page-grid" style={{ gap: 8, marginTop: 8 }}>
                          {aiInsights.alerts.map((alert) => (
                            <div key={alert} className="subtle">{alert}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <strong>Recommendations</strong>
                      {aiInsights.recommendations.length === 0 ? (
                        <div className="subtle" style={{ marginTop: 8 }}>No AI recommendations returned.</div>
                      ) : (
                        <div className="page-grid" style={{ gap: 8, marginTop: 8 }}>
                          {aiInsights.recommendations.map((recommendation) => (
                            <div key={recommendation} className="subtle">{recommendation}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="subtle">Open this reports view to generate an AI staffing summary.</div>
                )}
              </div>

              <div className="panel">
                <h2>Teacher Overload Alerts</h2>
                <p className="lead">Flags combine learner load, intervention hours, and escalation pressure.</p>
                {workload.overloadAlerts.length === 0 ? (
                  <div className="subtle">No overload alerts right now.</div>
                ) : (
                  <div className="page-grid">
                    {workload.overloadAlerts.map((teacher) => (
                      <div key={teacher.teacherId} className="table-card">
                        <div className="inline-actions" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <strong>{teacher.teacherName}</strong>
                            <div className="subtle">{teacher.sectionName}</div>
                          </div>
                          <span className={workloadPillClass(teacher.overloadLevel)}>{teacher.overloadLevel}</span>
                        </div>
                        <div className="subtle" style={{ marginTop: 10 }}>
                          {teacher.overloadReasons.length > 0 ? teacher.overloadReasons.join(' | ') : 'Workload watch'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="panel">
              <h2>Teacher Workload Analytics</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Section</th>
                      <th>Learners</th>
                      <th>Intervention Hours</th>
                      <th>Escalation Learners</th>
                      <th>Active Cases</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.teacherLoads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="subtle">No teacher workload data yet.</td>
                      </tr>
                    ) : (
                      workload.teacherLoads.map((teacher) => (
                        <tr key={teacher.teacherId}>
                          <td>{teacher.teacherName}</td>
                          <td>{teacher.sectionName}</td>
                          <td>{teacher.learnerCount}</td>
                          <td>{formatHours(teacher.interventionHours)}</td>
                          <td>{teacher.escalationLearnerCount}</td>
                          <td>{teacher.activeCaseCount}</td>
                          <td>
                            <span className={workloadPillClass(teacher.overloadLevel)}>{teacher.overloadLevel}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2>Escalation Watchlist</h2>
              <p className="lead">Learners listed here are contributing to teacher escalation pressure.</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Section</th>
                      <th>Teacher</th>
                      <th>Reasons</th>
                      <th>Signal Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.escalationLearners.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="subtle">No escalation learners right now.</td>
                      </tr>
                    ) : (
                      workload.escalationLearners.map((learner) => (
                        <tr key={learner.id}>
                          <td>{learner.last_name}, {learner.first_name}</td>
                          <td>{learner.section_name}</td>
                          <td>{learner.teacher_name}</td>
                          <td>{learner.reasons.join(', ')}</td>
                          <td>{learner.escalation_reason_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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
        role="admin"
        schoolYearLabel={schoolYearLabel}
        logoutAction={actions.logout}
      />
      <div className="main-wrap">
        <Sidebar 
          role="admin" 
          activeItem={activeItem} 
          onNavigate={setActiveItem} 
          counts={{ 
            teachers: data.teachers.length,
            sections: data.sections.length,
            interventions: data.interventions.length,
            irip: data.iripForwards.length,
            announcements: data.announcements.length
          }} 
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

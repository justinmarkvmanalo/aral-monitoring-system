import Link from 'next/link';

import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();
  const dashboardHref =
    session?.role === 'admin'
      ? '/admin/dashboard'
      : session?.role === 'teacher'
        ? '/teacher/dashboard'
        : null;
  const sessionLabel =
    session?.role === 'admin'
      ? 'Admin session active'
      : session?.role === 'teacher'
        ? 'Teacher session active'
        : null;

  return (
    <main className="shell">
      <div className="container page-grid">
        <section className="hero-card landing-hero">
          <div className="landing-shell">
            <div className="landing-intro">
              <div className="brand landing-brand">
                <div className="brand-mark">A</div>
                <div>
                  <div className="landing-brand-title">ARAL Monitor</div>
                  <div className="subtle">Attendance and learner progress hub</div>
                </div>
              </div>

              <span className="role-badge">School Monitoring System</span>
              <h1 className="landing-title">Pick what you need to do.</h1>
              <p className="lead landing-copy">
                Start with the teacher or admin workflow. The first screen should point you to the right task fast.
              </p>

              <div className="landing-actions">
                <Link className="button" href="/teacher/login">Teacher Sign In</Link>
                <Link className="button-secondary" href="/admin/login">Admin Sign In</Link>
                {dashboardHref ? <Link className="button-secondary" href={dashboardHref}>Continue Current Session</Link> : null}
              </div>

              {dashboardHref ? (
                <div className="landing-session-note">
                  <strong>{sessionLabel}</strong>
                  <span>Signed in as {session?.name}.</span>
                </div>
              ) : null}
            </div>

            <div className="landing-side">
              <article className="landing-portal portal-teacher">
                <div className="landing-portal-top">
                  <span className="landing-portal-tag">Teacher</span>
                  <h2>Handle class records</h2>
                  <p className="lead">Open attendance, reading, numeracy, science, and intervention tools for one section.</p>
                </div>
                <div className="landing-portal-list">
                  <span>Section setup</span>
                  <span>Student list</span>
                  <span>Daily monitoring</span>
                </div>
                <div className="landing-portal-actions">
                  <Link href="/teacher/login" className="button">Open Teacher Portal</Link>
                  <Link href="/teacher/register" className="button-secondary">Create Teacher Account</Link>
                </div>
              </article>

              <article className="landing-portal portal-admin">
                <div className="landing-portal-top">
                  <span className="landing-portal-tag admin">Admin</span>
                  <h2>Handle school oversight</h2>
                  <p className="lead">Review teachers, sections, attendance totals, and announcements from one admin dashboard.</p>
                </div>
                <div className="landing-portal-list">
                  <span>Teacher accounts</span>
                  <span>Section tracking</span>
                  <span>School reports</span>
                </div>
                <div className="landing-portal-actions">
                  <Link href="/admin/login" className="button-secondary admin-button">Open Admin Portal</Link>
                </div>
              </article>
            </div>
          </div>

          <div className="landing-footer">
            <div className="landing-footer-item">
              <strong>Teacher flow</strong>
              <span>Sign in, open your section, and record learner data.</span>
            </div>
            <div className="landing-footer-item">
              <strong>Admin flow</strong>
              <span>Sign in, check school-wide data, and manage announcements.</span>
            </div>
            <div className="landing-footer-item">
              <strong>Current setup</strong>
              <span>Built on the Next.js version of the legacy ARAL workflow.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

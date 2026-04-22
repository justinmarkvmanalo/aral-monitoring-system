import Link from 'next/link';

import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();
  const dashboardHref = session?.role === 'admin' ? '/admin/dashboard' : session?.role === 'teacher' ? '/teacher/dashboard' : null;

  return (
    <main className="shell">
      <div className="container page-grid">
        <section className="hero-card" style={{ padding: 32 }}>
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <div style={{ fontSize: 26 }}>ARAL Monitor</div>
              <div className="subtle">Attendance and learner progress hub rebuilt for Vercel</div>
            </div>
          </div>

          <div className="three-col" style={{ marginTop: 28 }}>
            <div>
              <h1 style={{ marginTop: 0 }}>Choose your portal</h1>
              <p className="lead">
                Use the teacher portal for class monitoring and the admin portal for school-wide oversight.
              </p>
              <div className="actions">
                <Link className="button" href="/teacher/login">Teacher Sign In</Link>
                <Link className="button-secondary" href="/admin/login">Admin Sign In</Link>
                {dashboardHref ? <Link className="button-secondary" href={dashboardHref}>Go to Current Session</Link> : null}
              </div>
            </div>

            <div className="panel">
              <h2>Teacher Portal</h2>
              <p className="lead">Manage sections, add students, record weekly attendance, and read school announcements.</p>
              <Link href="/teacher/register" className="button-secondary">Create Teacher Account</Link>
            </div>

            <div className="panel">
              <h2>Admin Portal</h2>
              <p className="lead">Review teachers and sections, track school totals, and post announcements.</p>
              <Link href="/admin/login" className="button-secondary">Open Admin Portal</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

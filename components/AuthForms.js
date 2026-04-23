'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { adminLoginAction, teacherLoginAction, teacherRegisterAction } from '@/app/actions';
import SubmitButton from '@/components/SubmitButton';

function AuthShell({
  title,
  subtitle,
  badge,
  badgeClassName = 'role-badge',
  accent = 'teacher',
  eyebrow,
  highlights = [],
  children,
  footer
}) {
  return (
    <div className="auth-wrap">
      <div className={`auth-layout auth-layout-${accent}`}>
        <section className="auth-stage">
          <Link href="/" className="auth-backlink">Back to role selection</Link>
          <div className="auth-stage-copy">
            <div className="brand auth-brand">
              <div className="brand-mark">A</div>
              <div>
                <div>ARAL Monitor</div>
                <div className="subtle">Attendance and learner progress hub</div>
              </div>
            </div>

            <span className={badgeClassName}>{badge}</span>
            <h1 className="auth-stage-title">{title}</h1>
            <p className="lead auth-stage-subtitle">{subtitle}</p>

            <div className="auth-highlight-list">
              {highlights.map((item) => (
                <div key={item.title} className="auth-highlight">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-stage-note">
            <span>{accent === 'admin' ? 'ADMIN' : 'TEACHER'}</span>
            <p>Designed to preserve the legacy workflow while running on the new app stack.</p>
          </div>
        </section>

        <section className="auth-card auth-panel">
          <div className="auth-panel-header">
            {eyebrow ? <div className="auth-eyebrow">{eyebrow}</div> : null}
            <h2>{title}</h2>
            <p className="lead">{subtitle}</p>
          </div>

          {children}

          <div className="auth-footer subtle">
            <Link href="/">Back to role selection</Link>
          </div>
          {footer ? <div className="auth-footer subtle">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}

export function TeacherLoginForm() {
  const [state, formAction] = useActionState(teacherLoginAction, {});

  return (
    <AuthShell
      title="Teacher Sign In"
      subtitle="Access your section dashboard and attendance tools."
      badge="Teacher Portal"
      eyebrow="Welcome back"
      highlights={[
        { title: 'Attendance', text: 'Record weekly presence, lateness, and follow-up cases.' },
        { title: 'Trackers', text: 'Continue reading, numeracy, science, and intervention records.' },
        { title: 'Section Data', text: 'Manage learners and keep one live class record per adviser.' }
      ]}
      footer={<Link href="/teacher/register">Need an account? Register here.</Link>}
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid auth-form">
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" placeholder="teacher@school.edu.ph" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" autoComplete="current-password" required />
        </div>
        <SubmitButton className="button auth-submit">Teacher Sign In</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function TeacherRegisterForm() {
  const [state, formAction] = useActionState(teacherRegisterAction, {});

  return (
    <AuthShell
      title="Create Teacher Account"
      subtitle="Register a teacher account for the Vercel-based app."
      badge="Teacher Onboarding"
      eyebrow="Teacher setup"
      highlights={[
        { title: 'One Account', text: 'Each teacher account can be paired to a section after sign-up.' },
        { title: 'Secure Access', text: 'Passwords are hashed and sessions are handled in the Next.js app.' },
        { title: 'Quick Start', text: 'After registration you will be redirected to section setup.' }
      ]}
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid auth-form">
        <div className="field">
          <label>Full Name</label>
          <input name="fullName" autoComplete="name" required />
        </div>
        <div className="field">
          <label>Initials</label>
          <input name="initials" maxLength={3} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" autoComplete="new-password" required />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" name="confirm" autoComplete="new-password" required />
        </div>
        <SubmitButton className="button auth-submit">Create Teacher Account</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, {});

  return (
    <AuthShell
      title="Admin Sign In"
      subtitle="Manage teachers, sections, and announcements."
      badge="Admin Portal"
      accent="admin"
      eyebrow="School oversight"
      highlights={[
        { title: 'Teacher Accounts', text: 'Provision teacher logins and monitor section assignment.' },
        { title: 'Attendance View', text: 'See class-level attendance totals and flagged learners.' },
        { title: 'Announcements', text: 'Post updates that appear directly on teacher dashboards.' }
      ]}
      badgeClassName="role-badge admin"
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid auth-form">
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" placeholder="admin@school.edu.ph" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" autoComplete="current-password" required />
        </div>
        <SubmitButton className="button auth-submit">Admin Sign In</SubmitButton>
      </form>
    </AuthShell>
  );
}

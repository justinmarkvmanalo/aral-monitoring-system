'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { adminLoginAction, teacherLoginAction, teacherRegisterAction } from '@/app/actions';
import SubmitButton from '@/components/SubmitButton';

function AuthShell({ title, subtitle, badge, badgeClassName = 'role-badge', children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div>ARAL Monitor</div>
            <div className="subtle">Vercel Edition</div>
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <span className={badgeClassName}>{badge}</span>
          <h1 style={{ marginBottom: 8 }}>{title}</h1>
          <p className="lead" style={{ margin: 0 }}>{subtitle}</p>
        </div>

        {children}

        <div style={{ marginTop: 16 }} className="subtle">
          <Link href="/">Back to role selection</Link>
        </div>
        {footer ? <div style={{ marginTop: 10 }} className="subtle">{footer}</div> : null}
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
      footer={<Link href="/teacher/register">Need an account? Register here.</Link>}
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid">
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" placeholder="teacher@school.edu.ph" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" />
        </div>
        <SubmitButton>Teacher Sign In</SubmitButton>
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
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid">
        <div className="field">
          <label>Full Name</label>
          <input name="fullName" />
        </div>
        <div className="field">
          <label>Initials</label>
          <input name="initials" maxLength={3} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" name="confirm" />
        </div>
        <SubmitButton>Create Teacher Account</SubmitButton>
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
      badgeClassName="role-badge admin"
    >
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <form action={formAction} className="form-grid">
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" placeholder="admin@school.edu.ph" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" />
        </div>
        <SubmitButton>Admin Sign In</SubmitButton>
      </form>
    </AuthShell>
  );
}

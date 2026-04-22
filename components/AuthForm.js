'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import SubmitButton from '@/components/SubmitButton';

export default function AuthForm({
  action,
  title,
  subtitle,
  badge,
  badgeClassName = 'role-badge',
  fields,
  footer
}) {
  const [state, formAction] = useActionState(action, {});

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

        {state?.error ? <div className="banner error">{state.error}</div> : null}
        {state?.success ? <div className="banner success">{state.success}</div> : null}

        <form action={formAction} className="form-grid">
          {fields}
          <SubmitButton>{title}</SubmitButton>
        </form>

        <div style={{ marginTop: 16 }} className="subtle">
          <Link href="/">Back to role selection</Link>
        </div>
        {footer ? <div style={{ marginTop: 10 }} className="subtle">{footer}</div> : null}
      </div>
    </div>
  );
}

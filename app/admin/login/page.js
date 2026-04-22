import AuthForm from '@/components/AuthForm';
import { adminLoginAction } from '@/app/actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === 'admin') {
    redirect('/admin/dashboard');
  }

  return (
    <AuthForm
      action={adminLoginAction}
      title="Admin Sign In"
      subtitle="Manage teachers, sections, and announcements."
      badge="Admin Portal"
      badgeClassName="role-badge admin"
      fields={
        <>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" placeholder="admin@school.edu.ph" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" />
          </div>
        </>
      }
    />
  );
}

import Link from 'next/link';

import AuthForm from '@/components/AuthForm';
import { teacherLoginAction } from '@/app/actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session?.role === 'teacher') {
    redirect('/teacher/dashboard');
  }

  return (
    <AuthForm
      action={teacherLoginAction}
      title="Teacher Sign In"
      subtitle="Access your section dashboard and attendance tools."
      badge="Teacher Portal"
      fields={
        <>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" placeholder="teacher@school.edu.ph" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" />
          </div>
        </>
      }
      footer={<Link href="/teacher/register">Need an account? Register here.</Link>}
    />
  );
}

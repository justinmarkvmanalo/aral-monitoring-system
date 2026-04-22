import AuthForm from '@/components/AuthForm';
import { teacherRegisterAction } from '@/app/actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherRegisterPage() {
  const session = await getSession();
  if (session?.role === 'teacher') {
    redirect('/teacher/dashboard');
  }

  return (
    <AuthForm
      action={teacherRegisterAction}
      title="Create Teacher Account"
      subtitle="Register a teacher account for the Vercel-based app."
      badge="Teacher Onboarding"
      fields={
        <>
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
        </>
      }
    />
  );
}

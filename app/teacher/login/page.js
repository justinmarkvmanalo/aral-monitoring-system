import { TeacherLoginForm } from '@/components/AuthForms';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session?.role === 'teacher') {
    redirect('/teacher/dashboard');
  }

  return <TeacherLoginForm />;
}

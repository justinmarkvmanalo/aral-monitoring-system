import { TeacherRegisterForm } from '@/components/AuthForms';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherRegisterPage() {
  const session = await getSession();
  if (session?.role === 'teacher') {
    redirect('/teacher/dashboard');
  }

  return <TeacherRegisterForm />;
}

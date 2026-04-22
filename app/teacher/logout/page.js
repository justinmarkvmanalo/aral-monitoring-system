import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/auth';

export default async function TeacherLogout() {
  await destroySession();
  redirect('/teacher/login');
}

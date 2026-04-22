import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/auth';

export default async function AdminLogout() {
  await destroySession();
  redirect('/admin/login');
}

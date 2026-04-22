import { AdminLoginForm } from '@/components/AuthForms';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === 'admin') {
    redirect('/admin/dashboard');
  }

  return <AdminLoginForm />;
}

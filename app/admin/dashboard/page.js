import {
  adminLogoutAction,
  addAnnouncementAction,
  addTeacherAction,
  deleteAnnouncementAction,
  deleteTeacherAction
} from '@/app/actions';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { requireRole } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/data';

export default async function AdminDashboardPage() {
  const session = await requireRole('admin');
  const data = await getAdminDashboardData();

  const actions = {
    addTeacher: addTeacherAction,
    addAnnouncement: addAnnouncementAction.bind(null, session),
    deleteTeacher: deleteTeacherAction,
    deleteAnnouncement: deleteAnnouncementAction
  };

  return (
    <AdminDashboardClient 
      session={session}
      data={data}
      actions={actions}
    />
  );
}

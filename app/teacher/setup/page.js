import { saveSectionAction } from '@/app/actions';
import SectionForm from '@/components/SectionForm';
import { TopNav, Sidebar } from '@/components/Navigation';
import { requireRole } from '@/lib/auth';
import { getDefaultSchoolYear } from '@/lib/date';
import { getTeacherSection } from '@/lib/data';

export default async function TeacherSetupPage() {
  const session = await requireRole('teacher');
  const section = await getTeacherSection(session.userId);
  const action = saveSectionAction.bind(null, session);
  const defaultSchoolYear = getDefaultSchoolYear();

  return (
    <>
      <TopNav user={session} role="teacher" />
      <div className="main-wrap">
        <Sidebar role="teacher" activeItem="setup" />
        <main className="content">
          <div className="page-header">
            <h1>{section ? 'Update Class Section' : 'Set Up Your Class'}</h1>
            <p>This is the first teacher step after account creation.</p>
          </div>

          <section className="panel">
            <SectionForm
              action={action}
              initialValues={{
                label: section?.school_year_label || defaultSchoolYear.label,
                startDate: section?.school_year_start_date || defaultSchoolYear.startDate,
                endDate: section?.school_year_end_date || defaultSchoolYear.endDate,
                gradeLevel: section?.grade_level || '',
                sectionName: section?.section_name || ''
              }}
            />
          </section>
        </main>
      </div>
    </>
  );
}

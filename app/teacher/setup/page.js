import { saveSectionAction } from '@/app/actions';
import SectionForm from '@/components/SectionForm';
import { requireRole } from '@/lib/auth';
import { getTeacherSection } from '@/lib/data';

export default async function TeacherSetupPage() {
  const session = await requireRole('teacher');
  const section = await getTeacherSection(session.userId);
  const action = saveSectionAction.bind(null, session);

  return (
    <main className="shell">
      <div className="container">
        <div className="nav-strip">
          <div>
            <div className="brand">
              <div className="brand-mark">A</div>
              <div>ARAL Monitor</div>
            </div>
            <h1>{section ? 'Update Class Section' : 'Set Up Your Class'}</h1>
            <p className="lead">This is the first teacher step after account creation.</p>
          </div>
        </div>

        <section className="panel">
          <SectionForm
            action={action}
            initialValues={{
              label: section?.school_year_label || '2026-2027',
              startDate: '2025-06-02',
              endDate: '2026-04-03',
              gradeLevel: section?.grade_level || '',
              sectionName: section?.section_name || ''
            }}
          />
        </section>
      </div>
    </main>
  );
}

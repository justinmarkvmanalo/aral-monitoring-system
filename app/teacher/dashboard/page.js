import { redirect } from 'next/navigation';

import {
  addStudentAction,
  saveAttendanceAction,
  saveNumeracyDrillAction,
  saveNumeracyScoresAction,
  saveReadingAssessmentAction,
  saveScienceQuizAction,
  saveInterventionAction
} from '@/app/actions';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { requireRole } from '@/lib/auth';
import { getTeacherDashboardData } from '@/lib/data';

export default async function TeacherDashboardPage() {
  const session = await requireRole('teacher');
  const data = await getTeacherDashboardData(session.userId);

  if (!data.section) {
    redirect('/teacher/setup');
  }

  // Bind actions with session
  const actions = {
    addStudent: addStudentAction.bind(null, session),
    saveAttendance: saveAttendanceAction.bind(null, session),
    saveNumeracyDrill: saveNumeracyDrillAction.bind(null, session),
    saveNumeracyScores: saveNumeracyScoresAction.bind(null, session),
    saveReadingAssessment: saveReadingAssessmentAction.bind(null, session),
    saveScienceQuiz: saveScienceQuizAction.bind(null, session),
    saveIntervention: saveInterventionAction.bind(null, session)
  };

  // Convert Map-like lookup to plain object for client component serialization
  const attendanceLookup = {};
  for (const row of data.attendance) {
    attendanceLookup[`${row.student_id}:${row.session_date}`] = row.status;
  }

  return (
    <TeacherDashboardClient 
      session={session}
      data={data}
      actions={actions}
      attendanceLookup={attendanceLookup}
    />
  );
}

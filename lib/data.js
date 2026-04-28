import { getCurrentDateValue } from '@/lib/date';
import { query, withTransaction } from '@/lib/db';

function isMissingRelation(error, relationName) {
  return error?.code === '42P01' && String(error?.message || '').includes(relationName);
}

export async function getTeacherSection(teacherId) {
  const result = await query(
    `select s.id, s.section_name, s.grade_level, s.school_year_id, sy.label as school_year_label,
            sy.start_date::text as school_year_start_date, sy.end_date::text as school_year_end_date
     from sections s
     left join school_years sy on sy.id = s.school_year_id
     where s.teacher_id = $1
     limit 1`,
    [teacherId]
  );
  return result.rows[0] || null;
}

export async function getTeacherStudents(sectionId) {
  const result = await query(
    `select id, first_name, last_name, middle_name, initials, lrn, gender, birth_date, enrolled_at
     from students
     where section_id = $1 and is_active = true
     order by last_name, first_name`,
    [sectionId]
  );
  return result.rows;
}

export async function getTeacherAttendance(sectionId, sessionDates) {
  if (!sectionId || sessionDates.length === 0) {
    return [];
  }

  const result = await query(
    `select a.student_id, a.session_date::text as session_date, a.status
     from attendance a
     inner join students s on s.id = a.student_id
     where s.section_id = $1
       and s.is_active = true
       and a.session_date = any($2::date[])`,
    [sectionId, sessionDates]
  );
  return result.rows;
}

export async function getAnnouncements(limit = 20) {
  const result = await query(
    `select a.id, a.title, a.message, a.created_at, ad.name as admin_name
     from announcements a
     left join admins ad on ad.id = a.admin_id
     order by a.created_at desc
     limit $1`,
    [limit]
  );
  return result.rows;
}

async function getAdminTeacherSummaries() {
  const result = await query(
    `select t.id, t.full_name, t.initials, t.email, s.section_name, count(st.id)::int as student_count
     from teachers t
     left join sections s on s.teacher_id = t.id
     left join students st on st.section_id = s.id and st.is_active = true
     group by t.id, t.full_name, t.initials, t.email, s.section_name
     order by t.full_name`
  );
  return result.rows;
}

export async function getTeacherDashboardData(teacherId) {
  const section = await getTeacherSection(teacherId);
  const attendanceConfig = buildAttendanceWeeks();
  const announcements = await getAnnouncements(10);

  if (!section) {
    return {
      section: null,
      students: [],
      attendance: [],
      attendanceWeeks: attendanceConfig.weeks,
      currentAttendanceWeekIndex: attendanceConfig.currentWeekIndex,
      announcements,
      stats: emptyStats(),
      numeracy: emptyNumeracyData(),
      reading: { assessments: [] },
      irip: { records: [] },
      science: emptyScienceData(),
      interventions: emptyInterventionData()
    };
  }

  const [
    students,
    attendance,
    latestDrill,
    scores,
    readingAssessments,
    iripRecords,
    scienceScores,
    scienceSummary,
    interventions,
    interventionFlags
  ] = await Promise.all([
    getTeacherStudents(section.id),
    getTeacherAttendance(section.id, attendanceConfig.sessionDates),
    getLatestNumeracyDrill(teacherId),
    getTeacherNumeracyScores(section.id),
    getTeacherReadingAssessments(section.id),
    getTeacherIripChecklists(section.id),
    getTeacherScienceScores(section.id),
    getTeacherScienceSummary(section.id),
    getTeacherInterventions(section.id),
    getTeacherInterventionFlags(section.id)
  ]);
  const stats = buildTeacherStats(students, attendance);

  return {
    section,
    students,
    attendance,
    attendanceWeeks: attendanceConfig.weeks,
    currentAttendanceWeekIndex: attendanceConfig.currentWeekIndex,
    announcements,
    stats,
    numeracy: buildNumeracyData(latestDrill, scores),
    reading: {
      assessments: readingAssessments
    },
    irip: {
      records: iripRecords
    },
    science: {
      scores: scienceScores,
      summary: scienceSummary
    },
    interventions: {
      records: interventions,
      flags: interventionFlags
    }
  };
}

export async function getAdminDashboardData() {
  const [teachers, sectionsRes, totalStudentsRes, announcementsRes, iripForwards] = await Promise.all([
    getAdminTeacherSummaries(),
    query(
      `select s.id, s.section_name, s.grade_level, sy.label as school_year_label, t.full_name as teacher_name,
              count(st.id)::int as student_count
       from sections s
       left join school_years sy on sy.id = s.school_year_id
       left join teachers t on t.id = s.teacher_id
       left join students st on st.section_id = s.id and st.is_active = true
       group by s.id, s.section_name, s.grade_level, sy.label, t.full_name
      order by s.grade_level, s.section_name`
    ),
    query(`select count(*)::int as count from students where is_active = true`),
    getAnnouncements(20),
    getAdminIripForwards()
  ]);
  const workloadAnalyticsPromise = getAdminWorkloadAnalytics(teachers);

  const today = getCurrentDateValue();
  const [attendanceRes, sectionAttendanceRes, interventionsRes, workloadAnalytics] = await Promise.all([
    query(
      `select status, count(*)::int as count
       from attendance
       where session_date = $1
       group by status`,
      [today]
    ),
    query(
      `select s.id, s.section_name, s.grade_level,
              coalesce(sum(case when a.status = 'P' then 1 else 0 end), 0)::int as present,
              coalesce(sum(case when a.status = 'A' then 1 else 0 end), 0)::int as absent,
              coalesce(sum(case when a.status = 'L' then 1 else 0 end), 0)::int as late,
              count(st.id)::int as total
       from sections s
       left join students st on st.section_id = s.id and st.is_active = true
       left join attendance a on a.student_id = st.id and a.session_date = $1
       group by s.id, s.section_name, s.grade_level
       order by s.grade_level, s.section_name`,
      [today]
    ),
    query(
      `select st.id, st.first_name, st.last_name, sec.section_name, t.full_name as teacher_name,
              count(a.id)::int as absence_count
       from students st
       join sections sec on sec.id = st.section_id
       left join teachers t on t.id = sec.teacher_id
       left join attendance a
         on a.student_id = st.id
        and a.status = 'A'
        and a.session_date >= date_trunc('month', current_date)
       where st.is_active = true
       group by st.id, st.first_name, st.last_name, sec.section_name, t.full_name
       having count(a.id) >= 3
       order by absence_count desc, st.last_name, st.first_name
       limit 20`
    ),
    workloadAnalyticsPromise
  ]);

  const attendanceSummary = { P: 0, A: 0, L: 0 };
  for (const row of attendanceRes.rows) {
    attendanceSummary[row.status] = row.count;
  }

  const unmarkedToday = Math.max(
    0,
    (totalStudentsRes.rows[0]?.count || 0) - attendanceSummary.P - attendanceSummary.A - attendanceSummary.L
  );

  return {
    teachers,
    sections: sectionsRes.rows,
    totalStudents: totalStudentsRes.rows[0]?.count || 0,
    announcements: announcementsRes,
    iripForwards,
    attendanceSummary,
    unmarkedToday,
    sectionAttendance: sectionAttendanceRes.rows,
    interventions: interventionsRes.rows,
    workloadAnalytics
  };
}

export async function getAdminWorkloadAnalytics(teacherRows = null) {
  const teachers = teacherRows || await getAdminTeacherSummaries();
  const [interventionWorkloadRes, escalationRes] = await Promise.all([
    query(
      `select recorded_by as teacher_id,
              count(*)::int as intervention_record_count,
              count(*) filter (where status in ('Open', 'In Progress'))::int as active_case_count
         from interventions
        group by recorded_by`
    ),
    query(
      `with latest_reading as (
         select distinct on (rl.student_id)
                rl.student_id, rl.level
           from reading_levels rl
          order by rl.student_id, rl.assessed_date desc, rl.id desc
       ),
       science_avg as (
         select ss.student_id, round(avg(ss.pct_score)::numeric, 0)::int as avg_pct
           from science_scores ss
          group by ss.student_id
       ),
       attendance_risk as (
         select st.id as student_id, 'Attendance'::text as reason
           from students st
           join attendance a on a.student_id = st.id
          where st.is_active = true
            and a.status = 'A'
            and a.session_date >= date_trunc('month', current_date)
          group by st.id
         having count(a.id) >= 3
       ),
       reading_risk as (
         select lr.student_id, 'Reading'::text as reason
           from latest_reading lr
          where lr.level = 'Frustration'
       ),
       science_risk as (
         select sa.student_id, 'Science'::text as reason
           from science_avg sa
          where sa.avg_pct < 60
       ),
       high_priority_risk as (
         select distinct i.student_id, 'High Priority'::text as reason
           from interventions i
          where i.priority = 'High'
            and i.status in ('Open', 'In Progress')
       ),
       combined_risk as (
         select * from attendance_risk
         union all
         select * from reading_risk
         union all
         select * from science_risk
         union all
         select * from high_priority_risk
       )
       select st.id, st.first_name, st.last_name, sec.section_name,
              t.id as teacher_id, t.full_name as teacher_name,
              array_agg(distinct cr.reason order by cr.reason) as reasons,
              count(distinct cr.reason)::int as escalation_reason_count
         from combined_risk cr
         join students st on st.id = cr.student_id
         join sections sec on sec.id = st.section_id
         left join teachers t on t.id = sec.teacher_id
        where st.is_active = true
        group by st.id, st.first_name, st.last_name, sec.section_name, t.id, t.full_name
        order by escalation_reason_count desc, st.last_name, st.first_name`
    )
  ]);

  const interventionLookup = new Map(
    interventionWorkloadRes.rows.map((row) => [
      Number(row.teacher_id),
      {
        interventionRecordCount: Number(row.intervention_record_count || 0),
        activeCaseCount: Number(row.active_case_count || 0)
      }
    ])
  );

  const escalationLearners = escalationRes.rows.map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    section_name: row.section_name,
    teacher_id: row.teacher_id ? Number(row.teacher_id) : null,
    teacher_name: row.teacher_name || 'Unassigned',
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    escalation_reason_count: Number(row.escalation_reason_count || 0)
  }));

  const escalationByTeacher = escalationLearners.reduce((map, learner) => {
    const teacherId = learner.teacher_id;
    if (!teacherId) {
      return map;
    }

    const current = map.get(teacherId) || [];
    current.push(learner);
    map.set(teacherId, current);
    return map;
  }, new Map());

  const teacherLoads = teachers
    .map((teacher) => {
      const teacherId = Number(teacher.id);
      const learnerCount = Number(teacher.student_count || 0);
      const interventionEntry = interventionLookup.get(teacherId) || {
        interventionRecordCount: 0,
        activeCaseCount: 0
      };
      const escalationGroup = escalationByTeacher.get(teacherId) || [];
      const interventionHours = interventionEntry.interventionRecordCount;
      const overloadReasons = [];
      let overloadScore = 0;

      if (learnerCount >= 30) {
        overloadScore += 2;
        overloadReasons.push(`${learnerCount} learners assigned`);
      } else if (learnerCount >= 20) {
        overloadScore += 1;
        overloadReasons.push(`${learnerCount} learners assigned`);
      }

      if (interventionHours >= 10) {
        overloadScore += 2;
        overloadReasons.push(`${interventionHours} intervention hours`);
      } else if (interventionHours >= 6) {
        overloadScore += 1;
        overloadReasons.push(`${interventionHours} intervention hours`);
      }

      if (escalationGroup.length >= 6) {
        overloadScore += 2;
        overloadReasons.push(`${escalationGroup.length} learners needing escalation`);
      } else if (escalationGroup.length >= 3) {
        overloadScore += 1;
        overloadReasons.push(`${escalationGroup.length} learners needing escalation`);
      }

      const overloadLevel =
        overloadScore >= 4 ? 'High' : overloadScore >= 2 ? 'Moderate' : 'Stable';

      return {
        teacherId,
        teacherName: teacher.full_name,
        sectionName: teacher.section_name || 'Unassigned',
        learnerCount,
        interventionRecordCount: interventionEntry.interventionRecordCount,
        interventionHours,
        activeCaseCount: interventionEntry.activeCaseCount,
        escalationLearnerCount: escalationGroup.length,
        escalationReasons: escalationGroup.slice(0, 3).map((learner) => ({
          learnerName: `${learner.last_name}, ${learner.first_name}`,
          reasons: learner.reasons
        })),
        overloadLevel,
        overloadReasons
      };
    })
    .sort((left, right) => {
      const levelOrder = { High: 3, Moderate: 2, Stable: 1 };
      const levelDiff = levelOrder[right.overloadLevel] - levelOrder[left.overloadLevel];
      if (levelDiff !== 0) {
        return levelDiff;
      }

      if (right.escalationLearnerCount !== left.escalationLearnerCount) {
        return right.escalationLearnerCount - left.escalationLearnerCount;
      }

      if (right.interventionHours !== left.interventionHours) {
        return right.interventionHours - left.interventionHours;
      }

      return right.learnerCount - left.learnerCount;
    });

  return {
    totals: {
      learners: teacherLoads.reduce((total, teacher) => total + teacher.learnerCount, 0),
      interventionHours: teacherLoads.reduce((total, teacher) => total + teacher.interventionHours, 0),
      escalationLearners: escalationLearners.length,
      overloadedTeachers: teacherLoads.filter((teacher) => teacher.overloadLevel !== 'Stable').length
    },
    estimationNote: 'Intervention hours are estimated from recorded intervention logs at one hour per log.',
    teacherLoads,
    overloadAlerts: teacherLoads.filter((teacher) => teacher.overloadLevel !== 'Stable'),
    escalationLearners
  };
}

export async function registerTeacher({ fullName, initials, email, passwordHash }) {
  return query(
    `insert into teachers (full_name, initials, email, password_hash)
     values ($1, $2, $3, $4)`,
    [fullName, initials, email, passwordHash]
  );
}

export async function createOrUpdateSection({ teacherId, label, startDate, endDate, gradeLevel, sectionName }) {
  return withTransaction(async (client) => {
    const existingYear = await client.query(`select id from school_years where label = $1 limit 1`, [label]);
    let schoolYearId = existingYear.rows[0]?.id;

    if (!schoolYearId) {
      const insertedYear = await client.query(
        `insert into school_years (label, start_date, end_date)
         values ($1, $2, $3)
         returning id`,
        [label, startDate, endDate]
      );
      schoolYearId = insertedYear.rows[0].id;
    }

    const existingSection = await client.query(`select id from sections where teacher_id = $1 limit 1`, [teacherId]);
    if (existingSection.rows[0]) {
      await client.query(
        `update sections
         set school_year_id = $1, grade_level = $2, section_name = $3
         where teacher_id = $4`,
        [schoolYearId, gradeLevel, sectionName, teacherId]
      );
    } else {
      await client.query(
        `insert into sections (school_year_id, grade_level, section_name, teacher_id)
         values ($1, $2, $3, $4)`,
        [schoolYearId, gradeLevel, sectionName, teacherId]
      );
    }
  });
}

export async function addStudent({ sectionId, firstName, lastName, middleName, lrn, gender, birthDate }) {
  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  return query(
    `insert into students
      (section_id, last_name, first_name, middle_name, initials, lrn, gender, birth_date, is_active, enrolled_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, true, current_date)`,
    [sectionId, lastName, firstName, middleName || null, initials, lrn, gender, birthDate || null]
  );
}

export async function saveAttendance({ teacherId, studentId, sessionDate, status }) {
  if (!status) {
    return query(`delete from attendance where student_id = $1 and session_date = $2`, [studentId, sessionDate]);
  }

  return query(
    `insert into attendance (student_id, session_date, status, recorded_by)
     values ($1, $2, $3, $4)
     on conflict (student_id, session_date)
     do update set status = excluded.status, recorded_by = excluded.recorded_by, updated_at = current_timestamp`,
    [studentId, sessionDate, status, teacherId]
  );
}

export async function createAnnouncement({ adminId, title, message }) {
  return query(
    `insert into announcements (admin_id, title, message)
     values ($1, $2, $3)`,
    [adminId, title, message]
  );
}

export async function addTeacherByAdmin({ fullName, initials, email, passwordHash }) {
  return registerTeacher({ fullName, initials, email, passwordHash });
}

export async function deleteTeacherByAdmin(teacherId) {
  return query(`delete from teachers where id = $1`, [teacherId]);
}

export async function deleteAnnouncementByAdmin(announcementId) {
  return query(`delete from announcements where id = $1`, [announcementId]);
}

export async function getLatestNumeracyDrill(teacherId) {
  const result = await query(
    `select id, section_id, skill, skill_name, level, total_items, label, questions, saved, created_at
     from numeracy_drills
     where teacher_id = $1
     order by created_at desc
     limit 1`,
    [teacherId]
  );
  return result.rows[0] || null;
}

export async function getTeacherNumeracyScores(sectionId) {
  const result = await query(
    `select ns.student_id, ns.raw_score, ns.pct_score, ns.mastery, ns.recorded_at,
            nq.id as quiz_id, nq.total_items, nq.quiz_date,
            nsk.skill_name,
            nd.skill, nd.label as session_label, nd.level,
            s.first_name, s.last_name
       from numeracy_scores ns
       left join numeracy_quizzes nq on nq.id = ns.quiz_id
       left join numeracy_skills nsk on nsk.id = nq.skill_id
       left join numeracy_drills nd
         on nd.section_id = nq.section_id
        and nd.skill_name = nsk.skill_name
        and nd.created_at::date = nq.quiz_date
       left join students s on s.id = ns.student_id
      where s.section_id = $1
      order by ns.recorded_at desc`,
    [sectionId]
  );
  return result.rows;
}

export async function saveNumeracyDrill({
  teacherId,
  sectionId,
  skill,
  skillName,
  level,
  totalItems,
  label,
  questions
}) {
  const result = await query(
    `insert into numeracy_drills (teacher_id, section_id, skill, skill_name, level, total_items, label, questions, saved)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, false)
     returning id, section_id, skill, skill_name, level, total_items, label, questions, saved, created_at`,
    [teacherId, sectionId, skill, skillName, level, totalItems, label, JSON.stringify(questions)]
  );
  return result.rows[0];
}

export async function saveNumeracyScores({ teacherId, drillId, scores }) {
  return withTransaction(async (client) => {
    const drillResult = await client.query(
      `select id, section_id, skill_name, total_items
       from numeracy_drills
       where id = $1 and teacher_id = $2
       limit 1`,
      [drillId, teacherId]
    );

    const drill = drillResult.rows[0];
    if (!drill) {
      throw new Error('Drill not found.');
    }

    const skillResult = await client.query(
      `insert into numeracy_skills (skill_name)
       values ($1)
       on conflict (skill_name)
       do update set skill_name = excluded.skill_name
       returning id`,
      [drill.skill_name]
    );

    const skillId = skillResult.rows[0].id;
    const quizResult = await client.query(
      `insert into numeracy_quizzes (section_id, skill_id, quiz_date, total_items, created_by)
       values ($1, $2, current_date, $3, $4)
       returning id`,
      [drill.section_id, skillId, drill.total_items, teacherId]
    );

    const quizId = quizResult.rows[0].id;
    let saved = 0;

    for (const score of scores) {
      if (!score.studentId) continue;
      await client.query(
        `insert into numeracy_scores (quiz_id, student_id, raw_score, pct_score, mastery)
         values ($1, $2, $3, $4, $5)`,
        [quizId, score.studentId, score.correct, score.percent, score.mastery]
      );
      saved += 1;
    }

    await client.query(`update numeracy_drills set saved = true where id = $1`, [drillId]);
    return { saved, quizId };
  });
}

export async function getTeacherReadingAssessments(sectionId) {
  const result = await query(
    `select rl.id, rl.student_id, rl.assessed_date, rl.level, rl.comprehension_pct, rl.pronunciation, rl.notes,
            rl.created_at, s.first_name, s.last_name
       from reading_levels rl
       inner join students s on s.id = rl.student_id
      where s.section_id = $1
      order by rl.assessed_date desc, rl.created_at desc`,
    [sectionId]
  );
  return result.rows;
}

export async function saveReadingAssessment({
  studentId,
  assessedDate,
  level,
  comprehensionPct,
  pronunciation,
  notes,
  teacherId
}) {
  return query(
    `insert into reading_levels (student_id, assessed_date, level, comprehension_pct, pronunciation, notes, recorded_by)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [studentId, assessedDate, level, comprehensionPct, pronunciation, notes, teacherId]
  );
}

export async function getTeacherIripChecklists(sectionId) {
  try {
    const result = await query(
      `select ic.id, ic.student_id, ic.grade_level, ic.tutor_name, ic.rows, ic.updated_at,
              s.first_name, s.last_name
         from irip_checklists ic
         inner join students s on s.id = ic.student_id
        where s.section_id = $1
        order by s.last_name, s.first_name`,
      [sectionId]
    );
    return result.rows;
  } catch (error) {
    if (isMissingRelation(error, 'irip_checklists')) {
      return [];
    }
    throw error;
  }
}

export async function getTeacherIripDocumentData(teacherId, studentId) {
  const section = await getTeacherSection(teacherId);
  if (!section) {
    return null;
  }

  const studentResult = await query(
    `select id, first_name, last_name
       from students
      where id = $1 and section_id = $2 and is_active = true
      limit 1`,
    [studentId, section.id]
  );

  const student = studentResult.rows[0];
  if (!student) {
    return null;
  }

  let iripRecord = null;
  try {
    const iripResult = await query(
      `select tutor_name, rows
         from irip_checklists
        where student_id = $1
        limit 1`,
      [studentId]
    );
    iripRecord = iripResult.rows[0] || null;
  } catch (error) {
    if (!isMissingRelation(error, 'irip_checklists')) {
      throw error;
    }
  }

  return {
    learnerName: `${student.last_name}, ${student.first_name}`,
    gradeLevel: `Grade ${section.grade_level}`,
    tutorName: iripRecord?.tutor_name || '',
    rows: normalizeIripRows(iripRecord?.rows)
  };
}

export async function getAdminIripForwardDocumentData(forwardId) {
  try {
    const result = await query(
      `select learner_name, grade_level, tutor_name, rows
         from irip_forwards
        where id = $1
        limit 1`,
      [forwardId]
    );

    const record = result.rows[0];
    if (!record) {
      return null;
    }

    return {
      learnerName: record.learner_name,
      gradeLevel: record.grade_level,
      tutorName: record.tutor_name,
      rows: normalizeIripRows(record.rows)
    };
  } catch (error) {
    if (isMissingRelation(error, 'irip_forwards')) {
      return null;
    }
    throw error;
  }
}

export async function saveIripChecklist({
  studentId,
  gradeLevel,
  tutorName,
  rows,
  teacherId
}) {
  try {
    return await query(
      `insert into irip_checklists (student_id, grade_level, tutor_name, rows, recorded_by, updated_by)
       values ($1, $2, $3, $4::jsonb, $5, $5)
       on conflict (student_id)
       do update set
         grade_level = excluded.grade_level,
         tutor_name = excluded.tutor_name,
         rows = excluded.rows,
         updated_by = excluded.updated_by,
         updated_at = current_timestamp`,
      [studentId, gradeLevel, tutorName, JSON.stringify(rows), teacherId]
    );
  } catch (error) {
    if (isMissingRelation(error, 'irip_checklists')) {
      const migrationError = new Error('IRIP storage is not set up yet. Apply the latest database schema update first.');
      migrationError.code = 'IRIP_TABLE_MISSING';
      throw migrationError;
    }
    throw error;
  }
}

export async function forwardIripToAdmin({ studentId, teacherId }) {
  const snapshot = await getTeacherIripDocumentData(teacherId, studentId);
  if (!snapshot) {
    return null;
  }

  const hasSavedRows = snapshot.rows.some((row) => row.status || row.notes);
  if (!hasSavedRows) {
    const missingDataError = new Error('Save the IRIP checklist first before forwarding it to the admin.');
    missingDataError.code = 'IRIP_FORWARD_EMPTY';
    throw missingDataError;
  }

  try {
    const result = await query(
      `insert into irip_forwards (student_id, teacher_id, learner_name, grade_level, tutor_name, rows)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning id, forwarded_at`,
      [
        studentId,
        teacherId,
        snapshot.learnerName,
        snapshot.gradeLevel,
        snapshot.tutorName,
        JSON.stringify(snapshot.rows)
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (isMissingRelation(error, 'irip_forwards')) {
      const migrationError = new Error('IRIP forwarding is not set up yet. Apply the latest database schema update first.');
      migrationError.code = 'IRIP_FORWARD_TABLE_MISSING';
      throw migrationError;
    }
    throw error;
  }
}

export async function getAdminIripForwards() {
  try {
    const result = await query(
      `select f.id, f.student_id, f.learner_name, f.grade_level, f.tutor_name, f.forwarded_at,
              sec.section_name, sec.grade_level as section_grade_level,
              t.full_name as teacher_name
         from irip_forwards f
         left join students st on st.id = f.student_id
         left join sections sec on sec.id = st.section_id
         left join teachers t on t.id = f.teacher_id
        order by f.forwarded_at desc, f.id desc`
    );

    return result.rows;
  } catch (error) {
    if (isMissingRelation(error, 'irip_forwards')) {
      return [];
    }
    throw error;
  }
}

export async function getTeacherScienceScores(sectionId) {
  const result = await query(
    `select ss.id, ss.student_id, ss.raw_score, ss.pct_score, ss.recorded_at,
            sq.quiz_date, sq.total_items, st.topic_name,
            s.first_name, s.last_name
       from science_scores ss
       inner join science_quizzes sq on sq.id = ss.quiz_id
       inner join science_topics st on st.id = sq.topic_id
       inner join students s on s.id = ss.student_id
      where sq.section_id = $1
      order by ss.recorded_at desc`,
    [sectionId]
  );
  return result.rows;
}

export async function getTeacherScienceSummary(sectionId) {
  const result = await query(
    `select sq.id, sq.quiz_date, st.topic_name,
            round(avg(ss.pct_score)::numeric, 0)::int as class_avg,
            count(*) filter (where ss.pct_score >= 67)::int as passed,
            count(*) filter (where ss.pct_score < 67)::int as needs_review
       from science_quizzes sq
       inner join science_topics st on st.id = sq.topic_id
       left join science_scores ss on ss.quiz_id = sq.id
      where sq.section_id = $1
      group by sq.id, sq.quiz_date, st.topic_name
      order by sq.quiz_date desc, sq.id desc
      limit 10`,
    [sectionId]
  );
  return result.rows;
}

export async function saveScienceQuiz({ teacherId, sectionId, topicName, totalItems, scores }) {
  return withTransaction(async (client) => {
    const topicResult = await client.query(
      `insert into science_topics (topic_name)
       values ($1)
       on conflict do nothing
       returning id`,
      [topicName]
    );

    let topicId = topicResult.rows[0]?.id;
    if (!topicId) {
      const existingTopic = await client.query(`select id from science_topics where topic_name = $1 limit 1`, [topicName]);
      topicId = existingTopic.rows[0]?.id;
    }

    const quizResult = await client.query(
      `insert into science_quizzes (section_id, topic_id, quiz_date, total_items, created_by)
       values ($1, $2, current_date, $3, $4)
       returning id`,
      [sectionId, topicId, totalItems, teacherId]
    );

    const quizId = quizResult.rows[0].id;
    let saved = 0;
    for (const score of scores) {
      await client.query(
        `insert into science_scores (quiz_id, student_id, raw_score, pct_score)
         values ($1, $2, $3, $4)`,
        [quizId, score.studentId, score.correct, score.percent]
      );
      saved += 1;
    }

    return { quizId, saved };
  });
}

export async function getTeacherInterventions(sectionId) {
  const result = await query(
    `select i.id, i.student_id, i.priority, i.concern_area, i.notes, i.status, i.created_at,
            s.first_name, s.last_name
       from interventions i
       inner join students s on s.id = i.student_id
      where s.section_id = $1
      order by i.created_at desc`,
    [sectionId]
  );
  return result.rows;
}

export async function saveIntervention({
  studentId,
  priority,
  concernArea,
  notes,
  status,
  teacherId
}) {
  return query(
    `insert into interventions (student_id, priority, concern_area, notes, status, recorded_by)
     values ($1, $2, $3, $4, $5, $6)`,
    [studentId, priority, concernArea, notes, status, teacherId]
  );
}

export async function getTeacherInterventionFlags(sectionId) {
  const [attendanceFlags, readingFlags, scienceFlags] = await Promise.all([
    query(
      `select st.id as student_id, st.first_name, st.last_name, 'Attendance' as concern_area,
              count(a.id)::int as metric
         from students st
         left join attendance a
           on a.student_id = st.id
          and a.status = 'A'
          and a.session_date >= date_trunc('month', current_date)
        where st.section_id = $1 and st.is_active = true
        group by st.id, st.first_name, st.last_name
       having count(a.id) >= 3`,
      [sectionId]
    ),
    query(
      `with latest_reading as (
         select distinct on (rl.student_id)
                rl.student_id, rl.level, s.first_name, s.last_name
           from reading_levels rl
           inner join students s on s.id = rl.student_id
          where s.section_id = $1
          order by rl.student_id, rl.assessed_date desc, rl.created_at desc
       )
       select student_id, first_name, last_name, 'Reading' as concern_area, 0::int as metric
         from latest_reading
        where level <> 'Independent'`,
      [sectionId]
    ),
    query(
      `with science_avg as (
         select ss.student_id, round(avg(ss.pct_score)::numeric, 0)::int as avg_pct,
                s.first_name, s.last_name
           from science_scores ss
           inner join students s on s.id = ss.student_id
          where s.section_id = $1
          group by ss.student_id, s.first_name, s.last_name
       )
       select student_id, first_name, last_name, 'Science' as concern_area, avg_pct as metric
         from science_avg
        where avg_pct < 67`,
      [sectionId]
    )
  ]);

  return [...attendanceFlags.rows, ...readingFlags.rows, ...scienceFlags.rows];
}

function emptyStats() {
  return {
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  };
}

function buildTeacherStats(students, attendanceRows) {
  const stats = {
    totalStudents: students.length,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  };

  const today = getCurrentDateValue();
  const lookup = new Map(attendanceRows.map((row) => [`${row.student_id}:${row.session_date}`, row.status]));
  for (const student of students) {
    const status = lookup.get(`${student.id}:${today}`);
    if (status === 'P') stats.presentToday += 1;
    if (status === 'A') stats.absentToday += 1;
    if (status === 'L') stats.lateToday += 1;
  }

  return stats;
}

function emptyNumeracyData() {
  return {
    latestDrill: null,
    scores: []
  };
}

function buildNumeracyData(latestDrill, scores) {
  return {
    latestDrill,
    scores
  };
}

function emptyScienceData() {
  return {
    scores: [],
    summary: []
  };
}

function emptyInterventionData() {
  return {
    records: [],
    flags: []
  };
}

function buildAttendanceWeeks(totalWeeks = 10) {
  const today = getCurrentDateValue();
  let cursor = parseDateValue(today);
  const weeks = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const dates = [];

    while (dates.length < 5) {
      if (isWeekday(cursor)) {
        dates.push(formatDateValue(cursor));
      }
      cursor = addDays(cursor, 1);
    }

    weeks.push({
      index: weekIndex,
      label: `Week ${weekIndex + 1}`,
      dates,
      rangeLabel: formatWeekRangeLabel(dates[0], dates[dates.length - 1])
    });
  }

  const sessionDates = weeks.flatMap((week) => week.dates);

  return {
    weeks,
    currentWeekIndex: 0,
    sessionDates
  };
}

function normalizeIripRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    week: Number(row?.week || 0) || 0,
    skill: String(row?.skill || '').trim(),
    status: String(row?.status || '').trim(),
    notes: String(row?.notes || '').trim()
  }));
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + amount);
  return nextDate;
}

function isWeekday(date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function formatDateValue(date) {
  return date.toISOString().slice(0, 10);
}

function formatWeekRangeLabel(startDate, endDate) {
  const startLabel = formatShortDate(startDate);
  const end = parseDateValue(endDate);
  const endLabel = end
    ? end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : endDate;
  return `${startLabel} - ${endLabel}`;
}

function formatShortDate(value) {
  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

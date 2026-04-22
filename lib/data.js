import { query, withTransaction } from '@/lib/db';

export async function getTeacherSection(teacherId) {
  const result = await query(
    `select s.id, s.section_name, s.grade_level, s.school_year_id, sy.label as school_year_label
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

export async function getTeacherWeekAttendance(sectionId, weekDates) {
  if (!sectionId || weekDates.length === 0) {
    return [];
  }

  const result = await query(
    `select a.student_id, a.session_date::text as session_date, a.status
     from attendance a
     inner join students s on s.id = a.student_id
     where s.section_id = $1
       and s.is_active = true
       and a.session_date = any($2::date[])`,
    [sectionId, weekDates]
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

export async function getTeacherDashboardData(teacherId) {
  const section = await getTeacherSection(teacherId);
  const weekDates = getCurrentWeekDates();
  const announcements = await getAnnouncements(10);

  if (!section) {
    return {
      section: null,
      students: [],
      attendance: [],
      weekDates,
      announcements,
      stats: emptyStats(),
      numeracy: emptyNumeracyData(),
      reading: { assessments: [] },
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
    scienceScores,
    scienceSummary,
    interventions,
    interventionFlags
  ] = await Promise.all([
    getTeacherStudents(section.id),
    getTeacherWeekAttendance(section.id, weekDates),
    getLatestNumeracyDrill(teacherId),
    getTeacherNumeracyScores(section.id),
    getTeacherReadingAssessments(section.id),
    getTeacherScienceScores(section.id),
    getTeacherScienceSummary(section.id),
    getTeacherInterventions(section.id),
    getTeacherInterventionFlags(section.id)
  ]);
  const stats = buildTeacherStats(students, attendance, weekDates);

  return {
    section,
    students,
    attendance,
    weekDates,
    announcements,
    stats,
    numeracy: buildNumeracyData(latestDrill, scores),
    reading: {
      assessments: readingAssessments
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
  const [teachersRes, sectionsRes, totalStudentsRes, announcementsRes] = await Promise.all([
    query(
      `select t.id, t.full_name, t.initials, t.email, s.section_name, count(st.id)::int as student_count
       from teachers t
       left join sections s on s.teacher_id = t.id
       left join students st on st.section_id = s.id and st.is_active = true
       group by t.id, t.full_name, t.initials, t.email, s.section_name
       order by t.full_name`
    ),
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
    getAnnouncements(20)
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const [attendanceRes, sectionAttendanceRes, interventionsRes] = await Promise.all([
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
    )
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
    teachers: teachersRes.rows,
    sections: sectionsRes.rows,
    totalStudents: totalStudentsRes.rows[0]?.count || 0,
    announcements: announcementsRes,
    attendanceSummary,
    unmarkedToday,
    sectionAttendance: sectionAttendanceRes.rows,
    interventions: interventionsRes.rows
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

function buildTeacherStats(students, attendanceRows, weekDates) {
  const stats = {
    totalStudents: students.length,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  };

  const today = new Date().toISOString().slice(0, 10);
  if (!weekDates.includes(today)) {
    return stats;
  }

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

function getCurrentWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

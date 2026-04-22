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
    return { section: null, students: [], attendance: [], weekDates, announcements, stats: emptyStats() };
  }

  const students = await getTeacherStudents(section.id);
  const attendance = await getTeacherWeekAttendance(section.id, weekDates);
  const stats = buildTeacherStats(students, attendance, weekDates);

  return { section, students, attendance, weekDates, announcements, stats };
}

export async function getAdminDashboardData() {
  const [teachersRes, sectionsRes, totalStudentsRes, announcementsRes] = await Promise.all([
    query(
      `select t.id, t.full_name, t.initials, t.email, s.section_name, count(st.id) as student_count
       from teachers t
       left join sections s on s.teacher_id = t.id
       left join students st on st.section_id = s.id and st.is_active = true
       group by t.id, t.full_name, t.initials, t.email, s.section_name
       order by t.full_name`
    ),
    query(
      `select s.id, s.section_name, s.grade_level, sy.label as school_year_label, t.full_name as teacher_name,
              count(st.id) as student_count
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
  const attendanceRes = await query(
    `select status, count(*)::int as count
     from attendance
     where session_date = $1
     group by status`,
    [today]
  );

  const attendanceSummary = { P: 0, A: 0, L: 0 };
  for (const row of attendanceRes.rows) {
    attendanceSummary[row.status] = row.count;
  }

  return {
    teachers: teachersRes.rows,
    sections: sectionsRes.rows,
    totalStudents: totalStudentsRes.rows[0]?.count || 0,
    announcements: announcementsRes,
    attendanceSummary
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

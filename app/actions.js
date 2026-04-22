'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { destroySession, loginAdmin, loginTeacher } from '@/lib/auth';
import {
  addStudent,
  addTeacherByAdmin,
  createAnnouncement,
  createOrUpdateSection,
  registerTeacher,
  saveAttendance
} from '@/lib/data';
import { query } from '@/lib/db';

function asText(formData, key) {
  return String(formData.get(key) || '').trim();
}

export async function teacherLoginAction(_, formData) {
  const email = asText(formData, 'email');
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const teacher = await loginTeacher(email, password);
  if (!teacher) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/teacher/dashboard');
}

export async function adminLoginAction(_, formData) {
  const email = asText(formData, 'email');
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const admin = await loginAdmin(email, password);
  if (!admin) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/admin/dashboard');
}

export async function teacherRegisterAction(_, formData) {
  const fullName = asText(formData, 'fullName');
  const initials = asText(formData, 'initials').toUpperCase();
  const email = asText(formData, 'email');
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');

  if (!fullName || !initials || !email || !password || !confirm) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' };
  }

  const existing = await query(`select id from teachers where email = $1 limit 1`, [email]);
  if (existing.rows[0]) {
    return { error: 'An account with that email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await registerTeacher({ fullName, initials, email, passwordHash });
  await loginTeacher(email, password);
  redirect('/teacher/setup');
}

export async function teacherLogoutAction() {
  await destroySession();
  redirect('/');
}

export async function adminLogoutAction() {
  await destroySession();
  redirect('/');
}

export async function saveSectionAction(session, _, formData) {
  const label = asText(formData, 'label');
  const startDate = asText(formData, 'startDate');
  const endDate = asText(formData, 'endDate');
  const gradeLevel = Number(formData.get('gradeLevel') || 0);
  const sectionName = asText(formData, 'sectionName');

  if (!label || !startDate || !endDate || !gradeLevel || !sectionName) {
    return { error: 'All fields are required.' };
  }

  await createOrUpdateSection({
    teacherId: session.userId,
    label,
    startDate,
    endDate,
    gradeLevel,
    sectionName
  });

  redirect('/teacher/dashboard');
}

export async function addStudentAction(session, _, formData) {
  const sectionId = Number(formData.get('sectionId') || 0);
  const firstName = asText(formData, 'firstName');
  const lastName = asText(formData, 'lastName');
  const middleName = asText(formData, 'middleName');
  const lrn = asText(formData, 'lrn');
  const gender = asText(formData, 'gender');
  const birthDate = asText(formData, 'birthDate');

  if (!sectionId || !firstName || !lastName || !lrn || !gender) {
    return { error: 'First name, last name, LRN, and gender are required.' };
  }

  const existing = await query(`select id from students where lrn = $1 limit 1`, [lrn]);
  if (existing.rows[0]) {
    return { error: 'A student with that LRN already exists.' };
  }

  await addStudent({ sectionId, firstName, lastName, middleName, lrn, gender, birthDate });
  revalidatePath('/teacher/dashboard');
  return { success: 'Student added successfully.' };
}

export async function saveAttendanceAction(session, formData) {
  const studentId = Number(formData.get('studentId') || 0);
  const sessionDate = asText(formData, 'sessionDate');
  const status = asText(formData, 'status');

  await saveAttendance({
    teacherId: session.userId,
    studentId,
    sessionDate,
    status
  });
  revalidatePath('/teacher/dashboard');
}

export async function addTeacherAction(_, formData) {
  const firstName = asText(formData, 'firstName');
  const lastName = asText(formData, 'lastName');
  const email = asText(formData, 'email');
  const password = String(formData.get('password') || '');

  if (!firstName || !lastName || !email || !password) {
    return { error: 'All fields are required.' };
  }

  const existing = await query(`select id from teachers where email = $1 limit 1`, [email]);
  if (existing.rows[0]) {
    return { error: 'A teacher with that email already exists.' };
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  const passwordHash = await bcrypt.hash(password, 10);

  await addTeacherByAdmin({ fullName, initials, email, passwordHash });
  revalidatePath('/admin/dashboard');
  return { success: 'Teacher added successfully.' };
}

export async function addAnnouncementAction(session, _, formData) {
  const title = asText(formData, 'title');
  const message = asText(formData, 'message');

  if (!title || !message) {
    return { error: 'Title and message are required.' };
  }

  await createAnnouncement({
    adminId: session.userId,
    title,
    message
  });

  revalidatePath('/admin/dashboard');
  revalidatePath('/teacher/dashboard');
  return { success: 'Announcement posted.' };
}

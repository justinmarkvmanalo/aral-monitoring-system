import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

import { query } from '@/lib/db';

const SESSION_COOKIE = 'aral_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.SESSION_SECRET || null;
}

function sign(value) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeSession(payload) {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json).toString('base64url');
  const signature = sign(body);
  if (!signature) {
    throw new Error('Missing SESSION_SECRET');
  }
  return `${body}.${signature}`;
}

function decodeSession(token) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split('.');
  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  if (!expected || expected !== signature) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
    return null;
  }
  return parsed;
}

export async function createSession(payload) {
  const store = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  store.set(SESSION_COOKIE, encodeSession({ ...payload, expiresAt }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!getSessionSecret()) {
    return null;
  }
  return decodeSession(token);
}

export async function requireRole(role) {
  const session = await getSession();
  if (!session || session.role !== role) {
    redirect(role === 'admin' ? '/admin/login' : '/teacher/login');
  }
  return session;
}

export async function loginTeacher(email, password) {
  const result = await query(
    `select id, full_name, initials, password_hash
     from teachers
     where email = $1
     limit 1`,
    [email]
  );

  const teacher = result.rows[0];
  if (!teacher) {
    return null;
  }

  const normalizedHash = teacher.password_hash.replace('$2y$', '$2b$');
  const valid = await bcrypt.compare(password, normalizedHash);
  if (!valid) {
    return null;
  }

  await createSession({
    role: 'teacher',
    userId: teacher.id,
    name: teacher.full_name,
    initials: teacher.initials
  });

  return teacher;
}

export async function loginAdmin(email, password) {
  const result = await query(
    `select id, name, initials, password
     from admins
     where email = $1
     limit 1`,
    [email]
  );

  const admin = result.rows[0];
  if (!admin) {
    return null;
  }

  const normalizedHash = admin.password.replace('$2y$', '$2b$');
  const valid = await bcrypt.compare(password, normalizedHash);
  if (!valid) {
    return null;
  }

  await createSession({
    role: 'admin',
    userId: admin.id,
    name: admin.name,
    initials: admin.initials || admin.name.slice(0, 2).toUpperCase()
  });

  return admin;
}

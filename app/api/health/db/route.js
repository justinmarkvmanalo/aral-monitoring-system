import { NextResponse } from 'next/server';

import { query } from '@/lib/db';

function getDatabaseUrlHost() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    return new URL(process.env.DATABASE_URL).host;
  } catch {
    return 'invalid-url';
  }
}

export async function GET() {
  const usesSplitDatabaseConfig = Boolean(
    process.env.SUPABASE_DB_HOST && process.env.SUPABASE_DB_USER && process.env.SUPABASE_DB_PASSWORD
  );
  const env = {
    selectedDatabaseConfig: usesSplitDatabaseConfig ? 'SUPABASE_DB_*' : 'DATABASE_URL',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlHost: getDatabaseUrlHost(),
    hasSupabaseDbHost: Boolean(process.env.SUPABASE_DB_HOST),
    supabaseDbHost: process.env.SUPABASE_DB_HOST || null,
    hasSupabaseDbUser: Boolean(process.env.SUPABASE_DB_USER),
    hasSupabaseDbPassword: Boolean(process.env.SUPABASE_DB_PASSWORD),
    supabaseDbSslMode: process.env.SUPABASE_DB_SSLMODE || null,
    hasSessionSecret: Boolean(process.env.SESSION_SECRET)
  };

  try {
    const connection = await query('select current_database() as database, current_user as user');
    const admins = await query('select count(*)::int as count from admins');

    return NextResponse.json({
      ok: true,
      env,
      database: connection.rows[0],
      adminCount: admins.rows[0]?.count ?? 0
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        env,
        error: {
          code: error?.code || null,
          name: error?.name || null,
          message: error?.message || 'Unknown database error'
        }
      },
      { status: 500 }
    );
  }
}

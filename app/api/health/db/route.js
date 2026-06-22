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
    const iripTables = await query(
      `select table_name
         from information_schema.tables
        where table_schema = 'public'
          and table_name in ('irip_checklists', 'irip_forwards')
        order by table_name`
    );
    const iripConstraints = await query(
      `select tc.constraint_name, tc.constraint_type, array_agg(kcu.column_name order by kcu.ordinal_position) as columns
         from information_schema.table_constraints tc
         left join information_schema.key_column_usage kcu
           on kcu.constraint_schema = tc.constraint_schema
          and kcu.constraint_name = tc.constraint_name
          and kcu.table_schema = tc.table_schema
          and kcu.table_name = tc.table_name
        where tc.table_schema = 'public'
          and tc.table_name = 'irip_checklists'
        group by tc.constraint_name, tc.constraint_type
        order by constraint_type, constraint_name`
    );

    return NextResponse.json({
      ok: true,
      env,
      database: connection.rows[0],
      adminCount: admins.rows[0]?.count ?? 0,
      irip: {
        tables: iripTables.rows.map((row) => row.table_name),
        hasChecklistTable: iripTables.rows.some((row) => row.table_name === 'irip_checklists'),
        hasForwardsTable: iripTables.rows.some((row) => row.table_name === 'irip_forwards'),
        constraints: iripConstraints.rows,
        hasChecklistStudentUnique: iripConstraints.rows.some(
          (row) => row.constraint_type === 'UNIQUE' && row.columns?.includes('student_id')
        )
      }
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

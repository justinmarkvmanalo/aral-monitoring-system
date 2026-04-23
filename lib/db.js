import { Pool } from 'pg';

const globalForDb = globalThis;

function getPoolMax() {
  const configured = Number(process.env.DB_POOL_MAX || process.env.PGPOOL_MAX || 3);
  if (!Number.isFinite(configured) || configured < 1) {
    return 3;
  }
  return Math.min(configured, 15);
}

function getSslConfig() {
  return process.env.SUPABASE_DB_SSLMODE === 'disable' ? false : { rejectUnauthorized: false };
}

function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    return {
      connectionString: process.env.DATABASE_URL,
      host: url.hostname,
      port: Number(url.port || 5432),
      database: decodeURIComponent(url.pathname.replace(/^\//, '') || 'postgres'),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: getSslConfig()
    };
  }

  const host = process.env.SUPABASE_DB_HOST;
  const user = process.env.SUPABASE_DB_USER;
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!host || !user || !password) {
    throw new Error(
      'Missing database configuration. Set DATABASE_URL or SUPABASE_DB_HOST, SUPABASE_DB_USER, and SUPABASE_DB_PASSWORD in Vercel.'
    );
  }

  return {
    host,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user,
    password,
    ssl: getSslConfig()
  };
}

export function getPool() {
  if (!globalForDb.__aralDbPool) {
    globalForDb.__aralDbPool = new Pool({
      ...getConnectionConfig(),
      max: getPoolMax(),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 10000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
      allowExitOnIdle: true
    });

    globalForDb.__aralDbPool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error);
    });
  }
  return globalForDb.__aralDbPool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function withTransaction(run) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await run(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

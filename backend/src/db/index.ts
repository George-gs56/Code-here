import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import os from 'os';

let pool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let usePGlite = false;

export async function getDb() {
  if (pool || pgliteInstance) {
    return { query, isPGlite: usePGlite };
  }

  const connectionString = process.env.DATABASE_URL;
  const isPlaceholderUrl = !!(connectionString && (
    connectionString.includes('placeholder') ||
    connectionString.includes('[YOUR-PASSWORD]') ||
    connectionString.includes('[YOUR_PASSWORD]') ||
    connectionString.includes('YOUR-PASSWORD') ||
    connectionString.includes('<password>')
  ));

  if (connectionString && !isPlaceholderUrl) {
    try {
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const client = await pool.connect();
      client.release();
      console.log('Connected to PostgreSQL via pg.Pool');
      usePGlite = false;
      return { query, isPGlite: false };
    } catch (err) {
      console.warn('PostgreSQL connection error, falling back to PGlite instance:', (err as Error).message);
    }
  }

  // Fallback to embedded PGlite PostgreSQL engine (Vercel Serverless / Read-Only safe)
  try {
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

    let dbDir = 'memory://';
    if (!isTest && !isVercel) {
      dbDir = path.join(__dirname, '../../pglite_data');
      if (!fs.existsSync(dbDir)) {
        try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) { dbDir = 'memory://'; }
      }
    } else if (isVercel) {
      dbDir = path.join(os.tmpdir(), 'pglite_data');
      if (!fs.existsSync(dbDir)) {
        try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) { dbDir = 'memory://'; }
      }
    }

    pgliteInstance = new PGlite(dbDir);
    await pgliteInstance.waitReady;
    console.log(`Initialized PGlite PostgreSQL database instance (${dbDir})`);
    usePGlite = true;

    // Run schema setup if needed
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pgliteInstance.exec(sql);
    }

    return { query, isPGlite: true };
  } catch (err) {
    console.error('Failed to initialize PGlite instance:', err);
    throw err;
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  await getDb();

  if (usePGlite && pgliteInstance) {
    const res = await pgliteInstance.query<T>(text, params);
    return {
      rows: res.rows,
      rowCount: res.rows.length,
    };
  }

  if (pool) {
    const res = await pool.query(text, params);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount || 0,
    };
  }

  throw new Error('Database not initialized');
}

export default {
  getDb,
  query,
};

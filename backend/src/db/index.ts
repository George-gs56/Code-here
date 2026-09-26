import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let usePGlite = false;

// Initialize Database connection
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

      // Test connection
      const client = await pool.connect();
      client.release();
      console.log('Connected to PostgreSQL via pg.Pool');
      usePGlite = false;
      return { query, isPGlite: false };
    } catch (err) {
      console.warn('PostgreSQL connection error, falling back to embedded PGlite instance:', (err as Error).message);
    }
  }

  // Fallback to embedded PGlite PostgreSQL engine
  try {
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    const dbDir = isTest ? 'memory://' : path.join(__dirname, '../../pglite_data');
    if (!isTest && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dbDir);
    await pgliteInstance.waitReady;
    console.log('Initialized embedded PGlite PostgreSQL database instance');
    usePGlite = true;

    // Run schema setup if needed
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pgliteInstance.exec(sql);
    }

    return { query, isPGlite: true };
  } catch (err) {
    console.error('Failed to initialize embedded PGlite instance:', err);
    throw err;
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  await getDb();

  if (usePGlite && pgliteInstance) {
    // PGlite query execution
    // Convert $1, $2 params if needed or pass directly
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

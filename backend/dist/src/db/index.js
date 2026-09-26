"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.query = query;
const pg_1 = require("pg");
const pglite_1 = require("@electric-sql/pglite");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
let pool = null;
let pgliteInstance = null;
let usePGlite = false;
async function getDb() {
    if (pool || pgliteInstance) {
        return { query, isPGlite: usePGlite };
    }
    const connectionString = process.env.DATABASE_URL;
    const isPlaceholderUrl = !!(connectionString && (connectionString.includes('placeholder') ||
        connectionString.includes('[YOUR-PASSWORD]') ||
        connectionString.includes('[YOUR_PASSWORD]') ||
        connectionString.includes('YOUR-PASSWORD') ||
        connectionString.includes('<password>')));
    if (connectionString && !isPlaceholderUrl) {
        try {
            pool = new pg_1.Pool({
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
        }
        catch (err) {
            console.warn('PostgreSQL connection error, falling back to PGlite instance:', err.message);
        }
    }
    // Fallback to embedded PGlite PostgreSQL engine (Vercel Serverless / Read-Only safe)
    try {
        const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
        let dbDir = 'memory://';
        if (!isTest && !isVercel) {
            dbDir = path_1.default.join(__dirname, '../../pglite_data');
            if (!fs_1.default.existsSync(dbDir)) {
                try {
                    fs_1.default.mkdirSync(dbDir, { recursive: true });
                }
                catch (e) {
                    dbDir = 'memory://';
                }
            }
        }
        else if (isVercel) {
            dbDir = path_1.default.join(os_1.default.tmpdir(), 'pglite_data');
            if (!fs_1.default.existsSync(dbDir)) {
                try {
                    fs_1.default.mkdirSync(dbDir, { recursive: true });
                }
                catch (e) {
                    dbDir = 'memory://';
                }
            }
        }
        pgliteInstance = new pglite_1.PGlite(dbDir);
        await pgliteInstance.waitReady;
        console.log(`Initialized PGlite PostgreSQL database instance (${dbDir})`);
        usePGlite = true;
        // Run schema setup if needed
        const schemaPath = path_1.default.join(__dirname, '../../../database/schema.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
            await pgliteInstance.exec(sql);
        }
        return { query, isPGlite: true };
    }
    catch (err) {
        console.error('Failed to initialize PGlite instance:', err);
        throw err;
    }
}
async function query(text, params = []) {
    await getDb();
    if (usePGlite && pgliteInstance) {
        const res = await pgliteInstance.query(text, params);
        return {
            rows: res.rows,
            rowCount: res.rows.length,
        };
    }
    if (pool) {
        const res = await pool.query(text, params);
        return {
            rows: res.rows,
            rowCount: res.rowCount || 0,
        };
    }
    throw new Error('Database not initialized');
}
exports.default = {
    getDb,
    query,
};

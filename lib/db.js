// lib/db.js
// Singleton pool — reused across hot-reloads in dev
import { Pool } from 'pg';

const globalForPg = globalThis;

const pool = globalForPg._pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // required for Railway
    : false,
  max: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPg._pgPool = pool;
}

/**
 * Execute a parameterised query.
 * @param {string} text  - SQL string with $1, $2 placeholders
 * @param {any[]}  params
 */
export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    const ms = Date.now() - start;
    if (ms > 300) console.warn(`⚠️  Slow query (${ms}ms):`, text.slice(0, 80));
  }
  return result;
}

export { pool };

// scripts/migrate-v2.js
// Run: node scripts/migrate-v2.js
// Adds: folders, tg_connections, notification flags to tasks

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🚀 Running Chronicle v2 migration...')

    // ── Folders table ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id         SERIAL PRIMARY KEY,
        user_id    TEXT NOT NULL,
        name       TEXT NOT NULL,
        emoji      TEXT DEFAULT '📁',
        color      TEXT DEFAULT '#8B5CF6',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ folders table ready')

    // ── Add folder_id to tasks ─────────────────────────────────────
    await client.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL
    `)
    console.log('✅ tasks.folder_id added')

    // ── Add notification flags to tasks ───────────────────────────
    await client.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS notified_1h BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notified_1d BOOLEAN DEFAULT FALSE
    `)
    console.log('✅ tasks notification flags added')

    // ── TG connections table ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS tg_connections (
        user_id    TEXT PRIMARY KEY,
        chat_id    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ tg_connections table ready')

    // ── Indexes for performance ────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_folder ON tasks(folder_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE completed = false;
    `)
    console.log('✅ Indexes created')

    console.log('\n🎉 Migration v2 complete!')
    console.log('📋 New features enabled:')
    console.log('   • Folders/categories for tasks')
    console.log('   • Telegram notification tracking')
    console.log('   • Deadline reminder flags')

  } catch (err) {
    console.error('❌ Migration error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()

// app/api/tasks/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// ─── Helper: get authed user or 401 ──────────────────────────
async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

// ─── GET /api/tasks?priority=1&done=false&date=2025-01-20 ─────
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const priority = searchParams.get('priority');
  const done     = searchParams.get('done');
  const date     = searchParams.get('date');
  const q        = searchParams.get('q');

  const conditions = ['user_id = $1'];
  const params     = [user.id];
  let   i          = 2;

  if (priority) { conditions.push(`priority = $${i++}`); params.push(parseInt(priority)); }
  if (done !== null && done !== undefined) {
    conditions.push(`done = $${i++}`); params.push(done === 'true');
  }
  if (date) { conditions.push(`date = $${i++}`); params.push(date); }
  if (q)    { conditions.push(`title ILIKE $${i++}`); params.push(`%${q}%`); }

  const { rows } = await query(
    `SELECT id, title, description,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            TO_CHAR(time, 'HH24:MI') AS time,
            priority, done, created_at, updated_at
     FROM tasks
     WHERE ${conditions.join(' AND ')}
     ORDER BY done ASC,
              CASE WHEN date IS NULL THEN 1 ELSE 0 END,
              date ASC, priority ASC, created_at DESC`,
    params
  );

  return NextResponse.json({ tasks: rows });
}

// ─── POST /api/tasks ──────────────────────────────────────────
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, date, time, priority } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 422 });
  }

  const { rows } = await query(
    `INSERT INTO tasks (user_id, title, description, date, time, priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description,
               TO_CHAR(date, 'YYYY-MM-DD') AS date,
               TO_CHAR(time, 'HH24:MI') AS time,
               priority, done, created_at, updated_at`,
    [user.id, title.trim(), description?.trim() || null, date || null, time || null, priority || 2]
  );

  return NextResponse.json({ task: rows[0] }, { status: 201 });
}

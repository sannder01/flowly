// app/api/tasks/[id]/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

// ─── PATCH /api/tasks/:id ─────────────────────────────────────
export async function PATCH(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['title', 'description', 'date', 'time', 'priority', 'done'];

  const updates = [];
  const values  = [];
  let i = 1;

  for (const field of allowed) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      values.push(
        field === 'title'       ? body[field].trim() :
        field === 'description' ? (body[field]?.trim() || null) :
        body[field] === ''      ? null :
        body[field]
      );
    }
  }

  if (!updates.length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // user_id check ensures users can't modify each other's tasks
  values.push(params.id, user.id);

  const { rows } = await query(
    `UPDATE tasks SET ${updates.join(', ')}
     WHERE id = $${i++} AND user_id = $${i}
     RETURNING id, title, description,
               TO_CHAR(date, 'YYYY-MM-DD') AS date,
               TO_CHAR(time, 'HH24:MI') AS time,
               priority, done, created_at, updated_at`,
    values
  );

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ task: rows[0] });
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────
export async function DELETE(_, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rowCount } = await query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
    [params.id, user.id]
  );

  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new Response(null, { status: 204 });
}

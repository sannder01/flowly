import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session-user'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = getSessionUserId(session)
    if (!userId) return Response.json([], { status: 401 })

    const result = await query(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY completed ASC, due_date ASC NULLS LAST, created_at DESC`,
      [userId]
    )
    return Response.json(result.rows)
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to load tasks' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    const userId = getSessionUserId(session)
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, due_date, priority, folder_id } = await req.json()
    if (!title?.trim()) return Response.json({ error: 'Title required' }, { status: 400 })

    const result = await query(
      `INSERT INTO tasks (user_id, title, due_date, priority, folder_id, completed)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
      [
        userId,
        title.trim(),
        due_date || null,
        priority || 'medium',
        folder_id || null,
      ]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to create task' }, { status: 500 })
  }
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session-user'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) return Response.json([], { status: 401 })

  const result = await query(
    'SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  )
  return Response.json(result.rows)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, emoji, color } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const result = await query(
    'INSERT INTO folders (user_id, name, emoji, color) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, name.trim(), emoji || '📁', color || '#8B5CF6']
  )
  return Response.json(result.rows[0], { status: 201 })
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session-user'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    const userId = getSessionUserId(session)
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId } = await req.json()
    if (!chatId) return Response.json({ error: 'chatId required' }, { status: 400 })

    await query(`
      INSERT INTO tg_connections (user_id, chat_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET chat_id = EXCLUDED.chat_id, updated_at = NOW()
    `, [userId, String(chatId)])

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to save Telegram chat id' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = getSessionUserId(session)
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await query(
      'SELECT chat_id FROM tg_connections WHERE user_id = $1',
      [userId]
    )
    return Response.json({ chatId: result.rows[0]?.chat_id || null })
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to load Telegram chat id' }, { status: 500 })
  }
}

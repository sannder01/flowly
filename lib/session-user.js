export function getSessionUserId(session) {
  // Some providers/adapters may omit `session.user.id`.
  // Fallback to email so API routes still work with TEXT `user_id` columns.
  return session?.user?.id || session?.user?.email || null
}


import { json } from '@sveltejs/kit'
import { lucia } from '$lib/server/auth'
import { db } from '$lib/db'
import { sessionTable } from '$lib/db/schema.js'
import { and, eq, not } from 'drizzle-orm'

export const POST = async ({ locals, cookies }) => {
	const userId = locals.user?.id
	if (!userId) return json({ error: 'Unauthorized' }, { status: 401 })

	const sessionId = cookies.get(lucia.sessionCookieName)
	if (!sessionId) return json({ error: 'Unauthorized' }, { status: 401 })

	await db
		.delete(sessionTable)
		.where(and(eq(sessionTable.userId, userId), not(eq(sessionTable.id, sessionId))))

	return json({ success: true })
}

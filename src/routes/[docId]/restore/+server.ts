import { db } from '$lib/db'
import { trashTable } from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { and, eq, inArray, or } from 'drizzle-orm'

type RestoreBody = {
	children: string[] | null
}

export const DELETE = async ({ locals, params, request }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { docId } = params
	const { children }: RestoreBody = await request.json()
	const ids = children ?? [docId]

	try {
		await db
			.delete(trashTable)
			.where(
				and(
					or(inArray(trashTable.folderId, ids), inArray(trashTable.fileId, ids)),
					eq(trashTable.userId, userId)
				)
			)

		return json({ success: true })
	} catch {
		return json({ success: false, message: 'Failed to restore' }, { status: 500 })
	}
}

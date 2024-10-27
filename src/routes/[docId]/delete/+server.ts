import { fileTable, folderTable, trashTable } from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { and, eq, inArray, or } from 'drizzle-orm'
import { dbPool as db } from '$lib/db'

type DeleteBody = {
	children: string[] | null
	parentFolderId: string | undefined
}

export const DELETE = async ({ locals, params, request }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { children, parentFolderId }: DeleteBody = await request.json()
		const ids = children ?? [params.docId]
		const trashDeleteIds = parentFolderId ? [...ids, parentFolderId] : ids

		await db.transaction(async (tx) => {
			await tx
				.delete(trashTable)
				.where(
					and(
						or(
							inArray(trashTable.folderId, trashDeleteIds),
							inArray(trashTable.fileId, trashDeleteIds)
						),
						eq(trashTable.userId, userId)
					)
				)

			await tx
				.delete(fileTable)
				.where(and(inArray(fileTable.id, ids), eq(fileTable.userId, userId)))

			if (children) {
				await tx
					.delete(folderTable)
					.where(and(inArray(folderTable.id, ids), eq(folderTable.userId, userId)))
			}
		})

		return json({ success: true })
	} catch (error) {
		console.error(error)
		return json({ success: false, message: 'Failed to delete' }, { status: 500 })
	}
}

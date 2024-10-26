import { db } from '$lib/db'
import { fileTable, folderTable, trashTable } from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

type MoveToDeleteBody = {
	folderId?: string
	fileId?: string
}

export const POST = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { folderId, fileId }: MoveToDeleteBody = await request.json()

		if (!folderId && !fileId) {
			return json({ success: false, message: 'No folder or file id provided' }, { status: 400 })
		}

		if (folderId) {
			const folder = await db.$count(folderTable, eq(folderTable.id, folderId))
			if (!folder) {
				return json({ success: false, message: 'Folder not found' }, { status: 404 })
			}
		} else if (fileId) {
			const file = await db.$count(fileTable, eq(fileTable.id, fileId))
			if (!file) {
				return json({ success: false, message: 'File not found' }, { status: 404 })
			}
		}

		await db.insert(trashTable).values({
			userId: locals.user.id,
			folderId,
			fileId
		})

		return json({ success: true })
	} catch (error) {
		return json({ success: false, message: 'Failed to move to trash' }, { status: 500 })
	}
}

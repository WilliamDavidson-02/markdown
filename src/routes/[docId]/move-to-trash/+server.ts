import { db } from '$lib/db'
import { fileTable, folderTable, trashTable } from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { inArray } from 'drizzle-orm'

type MoveToDeleteBody = {
	folderIds?: string[]
	fileIds?: string[]
}

export const POST = async ({ request, locals }) => {
	const userId = locals.user?.id

	if (!userId) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { folderIds, fileIds }: MoveToDeleteBody = await request.json()

		if (!folderIds && !fileIds) {
			return json({ success: false, message: 'No folder or file id provided' }, { status: 400 })
		}

		if (folderIds) {
			const folder = await db.$count(folderTable, inArray(folderTable.id, folderIds))
			if (folder === 0) {
				return json({ success: false, message: 'Folder not found' }, { status: 404 })
			}
		} else if (fileIds) {
			const file = await db.$count(fileTable, inArray(fileTable.id, fileIds))
			if (file === 0) {
				return json({ success: false, message: 'File not found' }, { status: 404 })
			}
		}

		const trashedFiles = fileIds?.map((id) => ({ userId, fileId: id })) ?? []
		const trashedFolders = folderIds?.map((id) => ({ userId, folderId: id })) ?? []

		console.log({ trashedFiles, trashedFolders })

		await db.insert(trashTable).values([...trashedFiles, ...trashedFolders])

		return json({ success: true })
	} catch (error) {
		console.error(error)
		return json({ success: false, message: 'Failed to move to trash' }, { status: 500 })
	}
}

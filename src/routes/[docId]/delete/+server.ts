import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	repositoryTable,
	trashTable
} from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { and, eq, inArray, isNull, or } from 'drizzle-orm'
import { dbPool, db } from '$lib/db'

type DeleteBody = {
	children: string[] | null
	parentFolderId: string | undefined
	isGithub?: boolean
}

export const DELETE = async ({ locals, params, request }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { children, parentFolderId, isGithub }: DeleteBody = await request.json()
		const ids = children ?? [params.docId]
		const trashDeleteIds = parentFolderId ? [...ids, parentFolderId] : ids

		if (isGithub) {
			const rootFolder = await db
				.select({
					repositoryId: githubFolderTable.repositoryId
				})
				.from(githubFolderTable)
				.where(
					and(inArray(githubFolderTable.folderId, trashDeleteIds), isNull(githubFolderTable.path))
				)
				.limit(1)

			if (rootFolder.length > 0) {
				await dbPool.transaction(async (tx) => {
					const repoId = rootFolder[0].repositoryId

					await tx.delete(githubFolderTable).where(eq(githubFolderTable.repositoryId, repoId))
					await tx.delete(githubFileTable).where(eq(githubFileTable.repositoryId, repoId))

					await tx
						.delete(trashTable)
						.where(
							or(
								inArray(trashTable.folderId, trashDeleteIds),
								inArray(trashTable.fileId, trashDeleteIds)
							)
						)

					await tx
						.delete(folderTable)
						.where(and(inArray(folderTable.id, trashDeleteIds), eq(folderTable.userId, userId)))
					await tx
						.delete(fileTable)
						.where(and(inArray(fileTable.id, trashDeleteIds), eq(fileTable.userId, userId)))

					await tx
						.delete(repositoryTable)
						.where(and(eq(repositoryTable.id, repoId), eq(repositoryTable.userId, userId)))
				})
				return json({ success: true })
			}
		}

		await dbPool.transaction(async (tx) => {
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

			const ghFile = (
				await tx
					.select({
						fileId: githubFileTable.fileId,
						sha: githubFileTable.sha
					})
					.from(githubFileTable)
					.where(inArray(githubFileTable.fileId, ids))
					.limit(1)
			)[0]

			// If file is new and then deleted before push remove it completely form gh table
			if (ghFile && !ghFile.sha) {
				await tx.delete(githubFileTable).where(eq(githubFileTable.fileId, ghFile.fileId ?? ''))
			}

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

import { db, dbPool } from '$lib/db/index.js'
import { fileTable, folderTable, githubFileTable, githubFolderTable } from '$lib/db/schema'
import { json } from '@sveltejs/kit'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import { z } from 'zod'
import { moveToSchema } from './schema'

/**
 * For every github folder or file when moved we remove the file/folder id from gh table on the old row
 * And insert a new row with the same id but setting the sha to null
 * This way we now what needs to be deleted or added when pushing to github
 */

export const PATCH = async ({ request, locals }) => {
	const user = locals.user
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const data: z.infer<typeof moveToSchema> = await request.json()

	const { error } = moveToSchema.safeParse(data)
	if (error) {
		return json({ error: 'Invalid request' }, { status: 400 })
	}

	const { target, movingTo, github } = data

	if (target.type === 'folder') {
		const folders = await db
			.select()
			.from(folderTable)
			.where(
				and(inArray(folderTable.id, [target.id, movingTo.id]), eq(folderTable.userId, user.id))
			)
		const files = await db
			.select({ id: fileTable.id, name: fileTable.name })
			.from(fileTable)
			.where(
				and(
					inArray(
						fileTable.id,
						target.children.fileIds.map((f) => f.id)
					),
					eq(fileTable.userId, user.id)
				)
			)

		if (github) {
			await dbPool.transaction(async (tx) => {
				const oldFiles = await tx
					.select({
						fileId: githubFileTable.fileId,
						sha: githubFileTable.sha,
						repositoryId: githubFileTable.repositoryId
					})
					.from(githubFileTable)
					.where(
						inArray(
							githubFileTable.fileId,
							target.children.fileIds.map((f) => f.id)
						)
					)

				await Promise.all(
					target.children.fileIds.map((f) =>
						tx
							.update(githubFileTable)
							.set({
								fileId: null
							})
							.where(and(eq(githubFileTable.fileId, f.id), isNotNull(githubFileTable.sha)))
					)
				)

				if (oldFiles.length > 0) {
					const movedBefore = target.children.fileIds.filter((f) =>
						oldFiles.find((gh) => gh.fileId === f.id && gh.sha === null)
					)
					const neverMoved = target.children.fileIds.filter((f) =>
						oldFiles.find((gh) => gh.fileId === f.id && gh.sha !== null)
					)

					if (movedBefore.length > 0) {
						await Promise.all(
							movedBefore.map((f) => {
								const file = files.find((file) => file.id === f.id)
								const name = file ? file.name + '.md' : ''
								const path = [...f.path.split('/'), name]
								return tx
									.update(githubFileTable)
									.set({ path: path.join('/'), fileId: f.id })
									.where(eq(githubFileTable.fileId, f.id))
							})
						)
					}

					if (neverMoved.length > 0) {
						await tx.insert(githubFileTable).values(
							neverMoved.map((f) => {
								const file = files.find((file) => file.id === f.id)
								const name = file ? file.name + '.md' : ''
								const path = [...f.path.split('/'), name]
								return {
									repositoryId: oldFiles[0].repositoryId,
									fileId: f.id,
									path: path.join('/')
								}
							})
						)
					}
				}

				const oldFolders = await tx
					.select({
						folderId: githubFolderTable.folderId,
						sha: githubFolderTable.sha,
						repositoryId: githubFolderTable.repositoryId
					})
					.from(githubFolderTable)
					.where(
						inArray(
							githubFolderTable.folderId,
							target.children.folderIds.map((f) => f.id)
						)
					)

				await Promise.all(
					target.children.folderIds.map((f) =>
						tx
							.update(githubFolderTable)
							.set({
								folderId: null
							})
							.where(and(eq(githubFolderTable.folderId, f.id), isNotNull(githubFolderTable.sha)))
					)
				)

				if (oldFolders.length > 0) {
					const movedBefore = target.children.folderIds.filter((f) =>
						oldFolders.find((gh) => gh.folderId === f.id && gh.sha === null)
					)
					const neverMoved = target.children.folderIds.filter((f) =>
						oldFolders.find((gh) => gh.folderId === f.id && gh.sha !== null)
					)

					if (movedBefore.length > 0) {
						await Promise.all(
							movedBefore.map((f) =>
								tx
									.update(githubFolderTable)
									.set({ path: f.path, folderId: f.id })
									.where(eq(githubFolderTable.folderId, f.id))
							)
						)
					}

					if (neverMoved.length > 0) {
						await tx.insert(githubFolderTable).values(
							neverMoved.map((f) => {
								return {
									repositoryId: oldFolders[0].repositoryId,
									folderId: f.id,
									path: f.path
								}
							})
						)
					}
				}
			})

			await db
				.update(folderTable)
				.set({ parentId: movingTo.id })
				.where(eq(folderTable.id, target.id))
		} else {
			await db
				.update(folderTable)
				.set({ parentId: movingTo.id })
				.where(eq(folderTable.id, target.id))
		}
	} else {
		const folder = await db.select().from(folderTable).where(eq(folderTable.id, movingTo.id))
		const file = await db.select().from(fileTable).where(eq(fileTable.id, target.id))

		if (folder.length !== 1 || file.length !== 1) {
			return json({ error: 'Invalid request' }, { status: 400 })
		}

		if (github) {
			await dbPool.transaction(async (tx) => {
				const oldGhFile = (
					await tx
						.select()
						.from(githubFileTable)
						.where(eq(githubFileTable.fileId, target.id))
						.limit(1)
				)[0]

				if (!oldGhFile) tx.rollback()

				await tx
					.update(githubFileTable)
					.set({ fileId: null })
					.where(and(eq(githubFileTable.fileId, target.id), isNotNull(githubFileTable.sha)))

				if (oldGhFile.sha === null) {
					await tx
						.update(githubFileTable)
						.set({ path: movingTo.path, fileId: target.id })
						.where(eq(githubFileTable.fileId, target.id))
				} else {
					await tx.insert(githubFileTable).values({
						repositoryId: oldGhFile.repositoryId,
						fileId: target.id,
						path: movingTo.path
					})
				}

				await tx.update(fileTable).set({ folderId: movingTo.id }).where(eq(fileTable.id, target.id))
			})
		} else {
			await db.update(fileTable).set({ folderId: movingTo.id }).where(eq(fileTable.id, target.id))
		}
	}

	return json({ success: true })
}

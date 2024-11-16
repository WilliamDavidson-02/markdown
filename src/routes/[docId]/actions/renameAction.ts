import { zod } from 'sveltekit-superforms/adapters'
import { renameSchema } from '../schemas'
import { fail, superValidate } from 'sveltekit-superforms'
import type { Action } from '@sveltejs/kit'
import { dbPool } from '$lib/db'
import { fileTable, folderTable, githubFileTable, githubFolderTable } from '$lib/db/schema'
import { and, eq, inArray, isNotNull, or } from 'drizzle-orm'

type GHFolderRow = typeof githubFolderTable.$inferSelect | undefined | null
type GHFileRow = typeof githubFileTable.$inferSelect | undefined | null

export const renameAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(renameSchema))

	const user = locals.user
	if (!user) return fail(401, { form })

	if (!form.valid) return fail(400, { form })

	const { id, name, type, icon, iconColor, github, children } = form.data

	if (type === 'file') {
		await dbPool.transaction(async (tx) => {
			if (github) {
				const oldFile = (
					await tx.select().from(githubFileTable).where(eq(githubFileTable.fileId, id)).limit(1)
				)[0]

				if (oldFile && oldFile.path?.split('/').pop()?.replace('.md', '') !== name.trim()) {
					await tx
						.update(githubFileTable)
						.set({ fileId: null })
						.where(and(eq(githubFileTable.fileId, id), isNotNull(githubFileTable.sha)))

					const newPath = oldFile.path?.split('/') ?? []
					newPath[newPath.length - 1] = name.trim() + '.md'

					if (oldFile.sha === null) {
						await tx
							.update(githubFileTable)
							.set({ path: newPath.join('/') })
							.where(eq(githubFileTable.fileId, id))
					} else {
						await tx.insert(githubFileTable).values({
							repositoryId: oldFile.repositoryId,
							fileId: id,
							path: newPath.join('/')
						})
					}
				}
			}
			await tx
				.update(fileTable)
				.set({ name: name.trim(), icon, iconColor })
				.where(and(eq(fileTable.id, id), eq(fileTable.userId, user.id)))
		})
	} else {
		await dbPool.transaction(async (tx) => {
			if (github) {
				const folders = await tx
					.select()
					.from(githubFolderTable)
					.where(
						and(
							or(
								eq(githubFolderTable.folderId, id),
								inArray(githubFolderTable.folderId, children?.folderIds ?? [])
							),
							isNotNull(githubFolderTable.path)
						)
					)
				let childFiles = await tx
					.select()
					.from(githubFileTable)
					.where(
						and(
							inArray(githubFileTable.fileId, children?.fileIds ?? []),
							isNotNull(githubFileTable.path)
						)
					)

				let [folder, childFolders] = folders.reduce(
					(acc, curr) => {
						if (curr?.folderId === id) acc[0] = curr
						else acc[1].push(curr)
						return acc
					},
					[null as GHFolderRow, [] as GHFolderRow[]]
				)

				if (folder && folder.path?.split('/').pop() !== name.trim()) {
					const newPath = folder.path?.split('/') ?? []
					newPath[newPath.length - 1] = name.trim()

					// Add the new path to the children
					childFolders = childFolders.map((f) => {
						if (!f?.path || !folder.path) return f
						return {
							...f,
							path: f.path.replace(folder.path, newPath.join('/'))
						}
					})
					childFiles = childFiles.map((f) => {
						if (!f?.path || !folder.path) return f
						return {
							...f,
							path: f.path.replace(folder.path, newPath.join('/'))
						}
					})

					// Remove fk from original gh rows
					const childFolderIds = childFolders.map((f) => f?.folderId ?? '').filter((f) => f !== '')
					await Promise.all(
						[...childFolderIds, id].map((id) =>
							tx
								.update(githubFolderTable)
								.set({ folderId: null })
								.where(and(eq(githubFolderTable.folderId, id), isNotNull(githubFolderTable.sha)))
						)
					)

					// Remove fk from original gh rows
					const childFileIds = childFiles.map((f) => f?.fileId ?? '').filter((f) => f !== '')
					await Promise.all(
						childFileIds.map((id) =>
							tx
								.update(githubFileTable)
								.set({ fileId: null })
								.where(and(eq(githubFileTable.fileId, id), isNotNull(githubFileTable.sha)))
						)
					)

					const [originalFolders, renamedFolders] = [folder, ...childFolders].reduce(
						(acc, curr) => {
							if (curr?.sha === null) acc[1].push(curr)
							else acc[0].push(curr)
							return acc
						},
						[[] as GHFolderRow[], [] as GHFolderRow[]]
					)

					if (renamedFolders.length > 0) {
						await Promise.all(
							renamedFolders.map((f) =>
								tx
									.update(githubFolderTable)
									.set({ path: f?.path })
									.where(eq(githubFolderTable.folderId, f?.folderId ?? ''))
							)
						)
					}

					if (originalFolders.length > 0) {
						await tx.insert(githubFolderTable).values(
							originalFolders.map((f) => ({
								repositoryId: f?.repositoryId ?? 0,
								folderId: f?.folderId ?? '',
								path: f?.path ?? ''
							}))
						)
					}

					const [originalFiles, renamedFiles] = childFiles.reduce(
						(acc, curr) => {
							if (curr?.sha === null) acc[1].push(curr)
							else acc[0].push(curr)
							return acc
						},
						[[] as GHFileRow[], [] as GHFileRow[]]
					)

					if (renamedFiles.length > 0) {
						await Promise.all(
							renamedFiles.map((f) =>
								tx
									.update(githubFileTable)
									.set({ path: f?.path })
									.where(eq(githubFileTable.fileId, f?.fileId ?? ''))
							)
						)
					}

					if (originalFiles.length > 0) {
						await tx.insert(githubFileTable).values(
							originalFiles.map((f) => ({
								repositoryId: f?.repositoryId ?? 0,
								fileId: f?.fileId ?? '',
								path: f?.path ?? ''
							}))
						)
					}
				}
			}
			await tx
				.update(folderTable)
				.set({ name: name.trim() })
				.where(and(eq(folderTable.id, id), eq(folderTable.userId, user.id)))
		})
	}

	return { form }
}

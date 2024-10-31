import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	githubInstallationTable,
	repositoryTable,
	trashTable
} from '$lib/db/schema.js'
import { and, desc, eq, inArray, notInArray } from 'drizzle-orm'
import { buildTree, sortTreeByDate } from '$lib/utilts/tree'
import {
	formatGithubFiles,
	formatGithubFolders,
	getAvailableRepositories,
	getFileIdsByRepositoryIds,
	getFolderIdsByRepositoryIds,
	getRepositoryFilesAndFolders,
	mergeReposWithInstallation
} from '$lib/utilts/github'
import { fileSchema, folderSchema, repositoriesSchema } from './schemas'
import { v4 as uuid } from 'uuid'

const getCurrentDocById = async (userId: string, docId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(
			and(eq(fileTable.id, docId), eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds))
		)
		.limit(1)
}

const getupdatedAtDoc = async (userId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(and(eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds)))
		.orderBy(desc(fileTable.updatedAt))
		.limit(1)
}

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		return redirect(302, `/`)
	}

	let currentDoc: (typeof fileTable.$inferSelect)[] | null = null
	const { docId } = params
	const userId = locals.user.id

	const trash = await db.select().from(trashTable).where(eq(trashTable.userId, userId))
	const trashIds = trash.map((t) => t.fileId).filter((id) => id !== null)

	// Get the current doc
	if (docId && z.string().uuid().safeParse(docId).success) {
		currentDoc = await getCurrentDocById(userId, docId, trashIds)
		if (!currentDoc || currentDoc.length === 0) {
			currentDoc = await getupdatedAtDoc(userId, trashIds)
		}
	} else {
		currentDoc = await getupdatedAtDoc(userId, trashIds)
	}

	let files = await db
		.select()
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.orderBy(desc(fileTable.updatedAt))
	let folders = await db.select().from(folderTable).where(eq(folderTable.userId, userId))

	let trashedFiles: (typeof fileTable.$inferSelect)[] = []
	let trashedFolders: (typeof folderTable.$inferSelect)[] = []

	files = files.filter((file) => {
		if (trash.some((t) => t.fileId === file.id)) {
			trashedFiles.push(file)
			return false
		}
		return true
	})

	const hasFolderWithNonTrashedContent = (folderId: string): boolean => {
		return (
			folders.some((f) => f.parentId === folderId && !trash.some((t) => t.folderId === f.id)) ||
			files.some((f) => f.folderId === folderId)
		)
	}

	folders = folders.filter((folder) => {
		const folderInTrash = trash.some((t) => t.folderId === folder.id)
		const folderHasNonTrashedContent = hasFolderWithNonTrashedContent(folder.id)

		if (folderInTrash && folderHasNonTrashedContent) {
			trashedFolders.push(folder)
			return true
		} else if (folderInTrash) {
			trashedFolders.push(folder)
			return false
		}
		return true
	})

	const builtTree = buildTree(folders, files)
	const builtTrashedTree = buildTree(trashedFolders, trashedFiles)

	const rootFiles = files.filter((file) => !file.folderId)
	const tree = sortTreeByDate([...builtTree, ...rootFiles])

	const rootTrashedFiles = trashedFiles.filter(
		(file) => !file.folderId || !trashedFolders.some((f) => f.id === file.folderId)
	)
	const trashedTree = [...builtTrashedTree, ...rootTrashedFiles]

	// Get users github installations
	const installations = await db
		.select()
		.from(githubInstallationTable)
		.where(eq(githubInstallationTable.userId, userId))

	const selectedRepositories = await db
		.select()
		.from(repositoryTable)
		.where(
			and(
				eq(repositoryTable.userId, userId),
				inArray(
					repositoryTable.installationId,
					installations.map((i) => i.id)
				)
			)
		)

	// Gets all available repositories for each installation from the github api
	const availableRepositories = await Promise.all(
		installations.map(async ({ id }) => {
			const repositories = await getAvailableRepositories(id)
			return { id, repositories }
		})
	)

	const mergedRepositories = installations.map((installation) =>
		mergeReposWithInstallation(selectedRepositories, installation.id)
	)

	const fileForm = await superValidate(zod(fileSchema))
	const folderForm = await superValidate(zod(folderSchema))
	const repositoriesForm = await superValidate(
		zod(
			repositoriesSchema.default({
				installations: mergedRepositories
			})
		)
	)

	return {
		currentDoc: currentDoc && currentDoc.length > 0 ? currentDoc[0] : null,
		tree,
		fileForm,
		folderForm,
		user: locals.user,
		trashedTree,
		installations,
		availableRepositories,
		repositoriesForm
	}
}

export const actions: Actions = {
	file: async ({ request, locals }) => {
		const form = await superValidate(request, zod(fileSchema))

		// The page is protected, so there should always be a user but just in case there isn't
		if (!locals.user || !form.valid) return fail(400, { form })

		const { icon, name, folderId } = form.data

		const file = await db
			.insert(fileTable)
			.values({
				userId: locals.user.id,
				icon,
				name: name.trim(),
				folderId
			})
			.returning({ id: fileTable.id })

		return { form, id: file[0].id }
	},
	folder: async ({ request, locals }) => {
		const form = await superValidate(request, zod(folderSchema))

		// The page is protected, so there should always be a user but just in case there isn't
		if (!locals.user || !form.valid) return fail(400, { form })

		const { name, parentId } = form.data

		const folder = await db
			.insert(folderTable)
			.values({
				userId: locals.user.id,
				name: name.trim(),
				parentId
			})
			.returning({ id: folderTable.id })

		return { form, id: folder[0].id }
	},
	repositories: async ({ request, locals }) => {
		const form = await superValidate(request, zod(repositoriesSchema))
		const userId = locals.user?.id

		if (!userId || !form.valid) return fail(400, { form })

		const { installations } = form.data

		for (const installation of installations) {
			const { repositories, installationId, removedRepositories } = installation

			if (!installationId) continue

			if (repositories.length > 0) {
				for (const repository of repositories) {
					const repoFolder = { id: uuid(), name: repository.full_name }
					const { files, folders, rootSha } = await getRepositoryFilesAndFolders(
						installationId,
						repository
					)

					let { formatedFolders, formatedGithubFoldersData } = formatGithubFolders(
						folders,
						repoFolder.id,
						repository.id
					)

					const foldersToInsert = [
						{ ...repoFolder, userId },
						...formatedFolders.map((f) => ({ ...f, userId }))
					]

					formatedGithubFoldersData = [
						{ id: rootSha, repositoryId: repository.id, folderId: repoFolder.id },
						...formatedGithubFoldersData
					]

					const { formatedFiles, formatedGithubFilesData } = formatGithubFiles(
						files,
						formatedFolders,
						repoFolder.id,
						repository.id
					)

					const filesToInsert = formatedFiles.map((f) => ({ ...f, userId }))

					try {
						await dbPool.transaction(async (tx) => {
							await tx.insert(repositoryTable).values({
								id: repository.id,
								name: repository.full_name,
								fullName: repository.full_name,
								htmlUrl: repository.html_url,
								installationId,
								userId
							})

							await tx.insert(folderTable).values(foldersToInsert)
							await tx.insert(fileTable).values(filesToInsert)

							await tx.insert(githubFolderTable).values(formatedGithubFoldersData)
							await tx.insert(githubFileTable).values(formatedGithubFilesData)
						})
					} catch (error) {
						throw Error('Failed to add repository')
					}
				}
			}

			if (removedRepositories.length > 0) {
				const folderIds = await getFolderIdsByRepositoryIds(removedRepositories)
				const fileIds = await getFileIdsByRepositoryIds(removedRepositories)

				try {
					await dbPool.transaction(async (tx) => {
						await tx
							.delete(folderTable)
							.where(and(inArray(folderTable.id, folderIds), eq(folderTable.userId, userId)))
						await tx
							.delete(fileTable)
							.where(and(inArray(fileTable.id, fileIds), eq(fileTable.userId, userId)))

						await tx
							.delete(repositoryTable)
							.where(
								and(
									inArray(repositoryTable.id, removedRepositories),
									eq(repositoryTable.userId, userId)
								)
							)
					})
				} catch (error) {
					throw Error('Failed to remove repository')
				}
			}
		}

		return { form }
	}
}

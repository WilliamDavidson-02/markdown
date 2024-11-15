import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	githubInstallationTable,
	keybindingTable,
	repositoryTable,
	settingsTable,
	trashTable,
	userTable
} from '$lib/db/schema'
import { and, desc, eq, inArray, notInArray, or, isNull } from 'drizzle-orm'
import { generateCaseThen } from '../github/git-pull/queries'
import type { GithubFileUpdate, GithubShaItemUpdate } from '$lib/utilts/githubTypes'
import { defaultEditorSettings } from '$lib/components/settings/defaultSettings'

export const getCurrentDocById = async (userId: string, docId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(
			and(eq(fileTable.id, docId), eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds))
		)
		.limit(1)
}

export const getUpdatedAtDoc = async (userId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(and(eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds)))
		.orderBy(desc(fileTable.updatedAt))
		.limit(1)
}

export const getAllFiles = async (userId: string) => {
	return await db
		.select()
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.orderBy(desc(fileTable.updatedAt))
}

export const getAllFolders = async (userId: string) => {
	return await db.select().from(folderTable).where(eq(folderTable.userId, userId))
}

export const getTrash = async (userId: string) => {
	return await db.select().from(trashTable).where(eq(trashTable.userId, userId))
}

export const getGithubInstallations = async (userId: string) => {
	return await db
		.select()
		.from(githubInstallationTable)
		.where(eq(githubInstallationTable.userId, userId))
}

export const getSelectedRepositories = async (userId: string, ids: number[]) => {
	return await db
		.select()
		.from(repositoryTable)
		.where(and(eq(repositoryTable.userId, userId), inArray(repositoryTable.installationId, ids)))
}

export const insertNewFile = async (file: typeof fileTable.$inferInsert, github?: boolean) => {
	if (github) {
		const parentFolderPath = (
			await db
				.select({ path: githubFolderTable.path, repositoryId: githubFolderTable.repositoryId })
				.from(githubFolderTable)
				.where(eq(githubFolderTable.folderId, file.folderId ?? ''))
				.limit(1)
		)[0]

		const newPath = [...(parentFolderPath.path?.split('/') ?? []), `${file.name}.md`].join('/')

		return await dbPool.transaction(async (tx) => {
			const newFile = await tx
				.insert(fileTable)
				.values({ ...file, doc: '' })
				.returning({ id: fileTable.id })

			await tx.insert(githubFileTable).values({
				repositoryId: parentFolderPath.repositoryId,
				fileId: newFile[0].id,
				path: newPath
			})

			return newFile[0].id
		})
	} else {
		return (
			await db
				.insert(fileTable)
				.values({ ...file, doc: '' })
				.returning({ id: fileTable.id })
		)[0].id
	}
}

export const insertNewFolder = async (
	folder: typeof folderTable.$inferInsert,
	github?: boolean
) => {
	if (github) {
		const parentFolderPath = (
			await db
				.select({ path: githubFolderTable.path, repositoryId: githubFolderTable.repositoryId })
				.from(githubFolderTable)
				.where(eq(githubFolderTable.folderId, folder.parentId ?? ''))
				.limit(1)
		)[0]

		const newPath = [...(parentFolderPath.path?.split('/') ?? []), folder.name].join('/')

		return await dbPool.transaction(async (tx) => {
			const newFolder = await tx
				.insert(folderTable)
				.values(folder)
				.returning({ id: folderTable.id })

			await tx.insert(githubFolderTable).values({
				repositoryId: parentFolderPath.repositoryId,
				folderId: newFolder[0].id,
				path: newPath
			})

			return newFolder[0].id
		})
	} else {
		return await db.insert(folderTable).values(folder).returning({ id: folderTable.id })
	}
}

export const insertNewRepository = async (
	repository: typeof repositoryTable.$inferInsert,
	foldersToInsert: (typeof folderTable.$inferInsert)[],
	filesToInsert: (typeof fileTable.$inferInsert)[],
	formatedGithubFoldersData: (typeof githubFolderTable.$inferInsert)[],
	formatedGithubFilesData: (typeof githubFileTable.$inferInsert)[]
) => {
	await dbPool.transaction(async (tx) => {
		await tx.insert(repositoryTable).values(repository)

		if (foldersToInsert.length > 0) {
			await tx.insert(folderTable).values(foldersToInsert)
		}
		if (filesToInsert.length > 0) {
			await tx.insert(fileTable).values(filesToInsert)
		}

		if (formatedGithubFoldersData.length > 0) {
			await tx.insert(githubFolderTable).values(formatedGithubFoldersData)
		}
		if (formatedGithubFilesData.length > 0) {
			await tx.insert(githubFileTable).values(formatedGithubFilesData)
		}
	})
}

export const removeRepository = async (
	userId: string,
	repoIds: number[],
	folderIds: string[],
	fileIds: string[]
) => {
	await dbPool.transaction(async (tx) => {
		// GH file and folder tables need to be delted before main table
		// Since the gh table has cascade set null on folderId and fileId
		await tx.delete(githubFolderTable).where(inArray(githubFolderTable.folderId, folderIds))
		await tx.delete(githubFileTable).where(inArray(githubFileTable.fileId, fileIds))

		await tx
			.delete(trashTable)
			.where(or(inArray(trashTable.folderId, folderIds), inArray(trashTable.fileId, fileIds)))

		await tx
			.delete(folderTable)
			.where(and(inArray(folderTable.id, folderIds), eq(folderTable.userId, userId)))
		await tx
			.delete(fileTable)
			.where(and(inArray(fileTable.id, fileIds), eq(fileTable.userId, userId)))

		await tx
			.delete(repositoryTable)
			.where(and(inArray(repositoryTable.id, repoIds), eq(repositoryTable.userId, userId)))
	})
}

export const getGithubFilesAndFoldersIds = async (userId: string) => {
	let fileIds: string[] = []
	let folderIds: string[] = []

	const githubFiles = await db
		.select({ id: fileTable.id })
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.innerJoin(githubFileTable, eq(fileTable.id, githubFileTable.fileId))

	fileIds = githubFiles.map((f) => f.id)

	const githubFolders = await db
		.select({ id: folderTable.id })
		.from(folderTable)
		.where(eq(folderTable.userId, userId))
		.innerJoin(githubFolderTable, eq(folderTable.id, githubFolderTable.folderId))

	folderIds = githubFolders.map((f) => f.id)

	return { fileIds, folderIds }
}

export const getGithubFileByIds = async (ids: string[], userId: string, repoId: number) => {
	const files = await db
		.select({
			id: githubFileTable.fileId,
			ghRowId: githubFileTable.id,
			content: fileTable.doc,
			sha: githubFileTable.sha,
			path: githubFileTable.path
		})
		.from(githubFileTable)
		.leftJoin(
			fileTable,
			and(eq(githubFileTable.fileId, fileTable.id), eq(fileTable.userId, userId))
		)
		.innerJoin(
			repositoryTable,
			and(
				eq(githubFileTable.repositoryId, repositoryTable.id),
				eq(repositoryTable.userId, userId),
				eq(repositoryTable.id, repoId)
			)
		)
		.where(or(inArray(githubFileTable.fileId, ids), isNull(githubFileTable.fileId)))

	return files.map((f) => ({
		id: f.id,
		content: f.content,
		sha: f.id ? f.sha : null, // if null file is deleted
		path: f.path,
		ghRowId: f.ghRowId
	}))
}

export const getGithubFolderByIds = async (ids: string[], userId: string, repoId: number) => {
	const folders = await db
		.select({
			id: githubFolderTable.folderId,
			ghRowId: githubFolderTable.id,
			sha: githubFolderTable.sha,
			path: githubFolderTable.path
		})
		.from(githubFolderTable)
		.leftJoin(
			folderTable,
			and(eq(githubFolderTable.folderId, folderTable.id), eq(folderTable.userId, userId))
		)
		.innerJoin(
			repositoryTable,
			and(
				eq(githubFolderTable.repositoryId, repositoryTable.id),
				eq(repositoryTable.userId, userId),
				eq(repositoryTable.id, repoId)
			)
		)
		.where(or(inArray(githubFolderTable.folderId, ids), isNull(githubFolderTable.folderId)))

	return folders.map((f) => ({
		id: f.id,
		sha: f.id ? f.sha : null, // if null folder is deleted
		path: f.path,
		ghRowId: f.ghRowId
	}))
}

export const deleteGithubFiles = async (ids: string[]) => {
	await db.delete(githubFileTable).where(inArray(githubFileTable.id, ids))
}

export const deleteGithubFolders = async (ids: string[]) => {
	await db.delete(githubFolderTable).where(inArray(githubFolderTable.id, ids))
}

export const getGithubRepoDataByFileId = async (fileId: string, userId: string) => {
	const installations = await db
		.select({
			id: githubInstallationTable.id,
			repoId: repositoryTable.id
		})
		.from(fileTable)
		.where(and(eq(fileTable.id, fileId), eq(fileTable.userId, userId)))
		.innerJoin(githubFileTable, eq(fileTable.id, githubFileTable.fileId))
		.innerJoin(repositoryTable, eq(githubFileTable.repositoryId, repositoryTable.id))
		.innerJoin(
			githubInstallationTable,
			eq(repositoryTable.installationId, githubInstallationTable.id)
		)
		.limit(1)

	return installations.length > 0 ? installations[0] : null
}

export const getGithubRepoDataByFolderId = async (folderId: string, userId: string) => {
	const installations = await db
		.select({
			id: githubInstallationTable.id,
			repoId: repositoryTable.id
		})
		.from(folderTable)
		.where(and(eq(folderTable.id, folderId), eq(folderTable.userId, userId)))
		.innerJoin(githubFolderTable, eq(folderTable.id, githubFolderTable.folderId))
		.innerJoin(repositoryTable, eq(githubFolderTable.repositoryId, repositoryTable.id))
		.innerJoin(
			githubInstallationTable,
			eq(repositoryTable.installationId, githubInstallationTable.id)
		)
		.limit(1)

	return installations.length > 0 ? installations[0] : null
}

export const updateGithubFolderShaAndPath = async (folders: GithubShaItemUpdate[]) => {
	if (folders.length > 0) {
		const folderShas = folders.map((f) => f.sha).filter((sha) => sha !== null)
		await db
			.update(githubFolderTable)
			.set({
				sha: generateCaseThen(folders, 'sha', 'newSha'),
				path: generateCaseThen(folders, 'sha', 'path')
			})
			.where(inArray(githubFolderTable.sha, folderShas))
	}
}

export const getUserByEmail = async (email: string) => {
	return await db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
}

export const updateUserPassword = async (userId: string, newPasswordHash: string) => {
	await db.update(userTable).set({ passwordHash: newPasswordHash }).where(eq(userTable.id, userId))
}

export const updateUserEmail = async (userId: string, newEmail: string) => {
	await db.update(userTable).set({ email: newEmail }).where(eq(userTable.id, userId))
}

export const getEditorSettings = async (userId: string): Promise<typeof defaultEditorSettings> => {
	const settings = await db
		.select({ settings: settingsTable.settings })
		.from(settingsTable)
		.where(eq(settingsTable.userId, userId))
		.limit(1)

	if (settings.length === 0) return defaultEditorSettings
	return settings[0].settings ?? defaultEditorSettings
}

export const updateEditorSettings = async (
	userId: string,
	settings: typeof settingsTable.$inferInsert.settings
) => {
	await db.update(settingsTable).set({ settings }).where(eq(settingsTable.userId, userId))
}

export const getKeybindings = async (userId: string) => {
	return await db.select().from(keybindingTable).where(eq(keybindingTable.userId, userId))
}

export const findKeybinding = async (name: string, userId: string) => {
	const keybinding = await db
		.select()
		.from(keybindingTable)
		.where(and(eq(keybindingTable.name, name), eq(keybindingTable.userId, userId)))
		.limit(1)

	return keybinding.length > 0 ? keybinding[0] : null
}

export const insertKeybinding = async (keybinding: typeof keybindingTable.$inferInsert) => {
	await db.insert(keybindingTable).values(keybinding)
}

export const updateKeybinding = async (keybinding: typeof keybindingTable.$inferInsert) => {
	await db
		.update(keybindingTable)
		.set({ key: keybinding.key })
		.where(
			and(eq(keybindingTable.name, keybinding.name), eq(keybindingTable.userId, keybinding.userId))
		)
}

export const deleteKeybinding = async (name: string, userId: string) => {
	await db
		.delete(keybindingTable)
		.where(and(eq(keybindingTable.name, name), eq(keybindingTable.userId, userId)))
}

export const updateMovedOrNewGithubFiles = async (files: GithubFileUpdate[]) => {
	if (files.length > 0) {
		await Promise.all(
			files.map((f) =>
				db
					.update(githubFileTable)
					.set({ sha: f.newSha })
					.where(eq(githubFileTable.fileId, f.id ?? ''))
			)
		)
	}
}

export const updateMovedOrNewGithubFolders = async (folders: GithubShaItemUpdate[]) => {
	if (folders.length > 0) {
		await Promise.all(
			folders.map((f) =>
				db
					.update(githubFolderTable)
					.set({ sha: f.newSha })
					.where(eq(githubFolderTable.folderId, f.id ?? ''))
			)
		)
	}
}

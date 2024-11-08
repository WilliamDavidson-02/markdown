import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	githubInstallationTable,
	repositoryTable,
	trashTable,
	userTable
} from '$lib/db/schema'
import { and, desc, eq, inArray, notInArray } from 'drizzle-orm'
import { generateCaseThen } from '../github/git-pull/queries'
import type { GithubShaItemUpdate } from '$lib/utilts/githubTypes'

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

export const insertNewFile = async (file: typeof fileTable.$inferInsert) => {
	return await db.insert(fileTable).values(file).returning({ id: fileTable.id })
}

export const insertNewFolder = async (folder: typeof folderTable.$inferInsert) => {
	return await db.insert(folderTable).values(folder).returning({ id: folderTable.id })
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

export const getGithubFileByIds = async (ids: string[], userId: string) => {
	const files = await db
		.select({
			id: fileTable.id,
			content: fileTable.doc,
			sha: githubFileTable.sha,
			path: githubFileTable.path
		})
		.from(fileTable)
		.where(and(inArray(fileTable.id, ids), eq(fileTable.userId, userId)))
		.innerJoin(githubFileTable, eq(fileTable.id, githubFileTable.fileId))

	return files
}

export const getGithubFolderByIds = async (ids: string[], userId: string) => {
	if (ids.length === 0) return []

	const folders = await db
		.select({
			id: folderTable.id,
			sha: githubFolderTable.sha,
			path: githubFolderTable.path
		})
		.from(folderTable)
		.where(and(inArray(folderTable.id, ids), eq(folderTable.userId, userId)))
		.innerJoin(githubFolderTable, eq(folderTable.id, githubFolderTable.folderId))

	return folders
}

export const getGithubInstallationIdByFileId = async (fileId: string, userId: string) => {
	const installations = await db
		.select({
			id: githubInstallationTable.id
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

	return installations.length > 0 ? installations[0].id : null
}

export const getGithubInstallationIdByFolderId = async (folderId: string, userId: string) => {
	const installations = await db
		.select({
			id: githubInstallationTable.id
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

	return installations.length > 0 ? installations[0].id : null
}

export const updateGithubFolderShaAndPath = async (folders: GithubShaItemUpdate[]) => {
	if (folders.length > 0) {
		const folderShas = folders.map((f) => f.sha)
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

import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	githubInstallationTable,
	repositoryTable,
	trashTable
} from '$lib/db/schema'
import { and, desc, eq, inArray, notInArray } from 'drizzle-orm'

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

export const insertNewFile = async (userId: string, file: typeof fileTable.$inferInsert) => {
	return await db.insert(fileTable).values(file).returning({ id: fileTable.id })
}

export const insertNewFolder = async (userId: string, folder: typeof folderTable.$inferInsert) => {
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

		await tx.insert(folderTable).values(foldersToInsert)
		await tx.insert(fileTable).values(filesToInsert)

		await tx.insert(githubFolderTable).values(formatedGithubFoldersData)
		await tx.insert(githubFileTable).values(formatedGithubFilesData)
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

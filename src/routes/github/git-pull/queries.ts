import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	repositoryTable
} from '$lib/db/schema'
import type {
	GithubFile,
	GithubFileUpdate,
	GithubFolder,
	GithubShaItem,
	GithubShaItemUpdate
} from '$lib/utilts/githubTypes'
import { and, eq, inArray, sql, SQL } from 'drizzle-orm'

export const getFileSha = async (fileIds: string[], userId: string): Promise<GithubShaItem[]> => {
	return await db
		.select({
			id: fileTable.id,
			sha: githubFileTable.sha,
			path: githubFileTable.path
		})
		.from(githubFileTable)
		.where(inArray(githubFileTable.fileId, fileIds))
		.innerJoin(
			fileTable,
			and(eq(githubFileTable.fileId, fileTable.id), eq(fileTable.userId, userId))
		)
}

export const getFolderSha = async (
	folderIds: string[],
	userId: string
): Promise<GithubShaItem[]> => {
	return await db
		.select({
			id: folderTable.id,
			sha: githubFolderTable.sha,
			path: githubFolderTable.path
		})
		.from(githubFolderTable)
		.where(inArray(githubFolderTable.folderId, folderIds))
		.innerJoin(
			folderTable,
			and(eq(githubFolderTable.folderId, folderTable.id), eq(folderTable.userId, userId))
		)
}

export const getInstallationIdByRootFolder = async (rootFolderId: string, userId: string) => {
	const repositories = await db
		.select({ installationId: repositoryTable.installationId, repositoryId: repositoryTable.id })
		.from(githubFolderTable)
		.where(eq(githubFolderTable.folderId, rootFolderId))
		.innerJoin(
			folderTable,
			and(eq(githubFolderTable.folderId, folderTable.id), eq(folderTable.userId, userId))
		)
		.innerJoin(repositoryTable, eq(githubFolderTable.repositoryId, repositoryTable.id))

	return repositories.length > 0 ? repositories[0] : null
}

export const generateCaseThen = (
	items: GithubShaItemUpdate[],
	column: 'id' | 'sha',
	then: keyof GithubShaItemUpdate
): SQL => {
	const sqlChunks: SQL[] = []
	sqlChunks.push(sql`CASE`)
	for (const item of items) {
		sqlChunks.push(sql`WHEN ${sql.raw(column)} = ${item[column]} THEN ${item[then]}`)
	}
	sqlChunks.push(sql`END`)
	return sql.join(sqlChunks, sql.raw(' '))
}

export const updateFolderAndFileNames = async (
	files: GithubShaItemUpdate[],
	folders: GithubShaItemUpdate[]
) => {
	if (files.length > 0) {
		const fileIds = files.map((f) => f.id)
		await db
			.update(fileTable)
			.set({ name: generateCaseThen(files, 'id', 'name'), updatedAt: sql`CURRENT_TIMESTAMP` })
			.where(inArray(fileTable.id, fileIds))
	}

	if (folders.length > 0) {
		const folderIds = folders.map((f) => f.id)
		await db
			.update(folderTable)
			.set({ name: generateCaseThen(folders, 'id', 'name') })
			.where(inArray(folderTable.id, folderIds))
	}
}

export const updateFolderAndFilePaths = async (
	files: GithubShaItemUpdate[],
	folders: GithubShaItemUpdate[]
) => {
	if (files.length > 0) {
		const fileShas = files.map((f) => f.sha)
		await db
			.update(githubFileTable)
			.set({ path: generateCaseThen(files, 'sha', 'path') })
			.where(inArray(githubFileTable.sha, fileShas))
	}

	if (folders.length > 0) {
		const folderShas = folders.map((f) => f.sha)
		await db
			.update(githubFolderTable)
			.set({ path: generateCaseThen(folders, 'sha', 'path') })
			.where(inArray(githubFolderTable.sha, folderShas))
	}
}

const generateCaseThenContent = (
	files: GithubFileUpdate[],
	column: 'sha' | 'id',
	then: keyof GithubFile | 'newSha'
) => {
	const sqlChunks: SQL[] = []
	sqlChunks.push(sql`CASE`)
	for (const file of files) {
		sqlChunks.push(sql`WHEN ${sql.raw(column)} = ${file[column]} THEN ${file[then]}`)
	}
	sqlChunks.push(sql`END`)
	return sql.join(sqlChunks, sql.raw(' '))
}

export const updateFileContents = async (files: GithubFileUpdate[]) => {
	if (files.length > 0) {
		const fileIds = files.map((f) => f.id)
		await db
			.update(fileTable)
			.set({
				doc: generateCaseThenContent(files, 'id', 'content'),
				name: generateCaseThenContent(files, 'id', 'name'),
				updatedAt: sql`CURRENT_TIMESTAMP`
			})
			.where(inArray(fileTable.id, fileIds))
	}
}

export const updateGithubFileShaAndPath = async (files: GithubFileUpdate[]) => {
	if (files.length > 0) {
		const fileShas = files.map((f) => f.sha)
		await db
			.update(githubFileTable)
			.set({
				sha: generateCaseThenContent(files, 'sha', 'newSha'),
				path: generateCaseThenContent(files, 'sha', 'path')
			})
			.where(inArray(githubFileTable.sha, fileShas))
	}
}

export const insertNewFilesAndFolders = async (
	foldersToInsert: (typeof folderTable.$inferInsert)[],
	filesToInsert: (typeof fileTable.$inferInsert)[],
	formatedGithubFoldersData: (typeof githubFolderTable.$inferInsert)[],
	formatedGithubFilesData: (typeof githubFileTable.$inferInsert)[]
) => {
	return await dbPool.transaction(async (tx) => {
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

export const deleteFoldersAndFiles = async (
	folders: GithubShaItem[],
	files: GithubShaItem[],
	userId: string
) => {
	// Github files and folders table fk to main tables has cascade
	return await dbPool.transaction(async (tx) => {
		if (folders.length > 0) {
			await tx.delete(folderTable).where(
				and(
					inArray(
						folderTable.id,
						folders.map((f) => f.id)
					),
					eq(folderTable.userId, userId)
				)
			)
		}
		if (files.length > 0) {
			await tx.delete(fileTable).where(
				and(
					inArray(
						fileTable.id,
						files.map((f) => f.id)
					),
					eq(fileTable.userId, userId)
				)
			)
		}
	})
}

export const updateRootFolderSha = async (rootFolderId: string, sha: string) => {
	return await db
		.update(githubFolderTable)
		.set({ sha })
		.where(eq(githubFolderTable.folderId, rootFolderId))
}
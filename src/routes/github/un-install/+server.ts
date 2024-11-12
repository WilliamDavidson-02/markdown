import { db, dbPool } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	githubInstallationTable,
	repositoryTable
} from '$lib/db/schema'
import {
	deleteGithubInstallation,
	generateGitHubJWT,
	getFileIdsByRepositoryIds,
	getFolderIdsByRepositoryIds
} from '$lib/utilts/github'
import { json } from '@sveltejs/kit'
import { and, eq, inArray } from 'drizzle-orm'

export const DELETE = async ({ request, locals }) => {
	const { installationId }: { installationId: number } = await request.json()
	const userId = locals.user?.id

	if (!installationId || !userId) {
		return json({ success: false }, { status: 400 })
	}

	const jwtToken = generateGitHubJWT()
	const deleteResponse = await deleteGithubInstallation(installationId, jwtToken)
	if (!deleteResponse) {
		return json({ success: false }, { status: 500 })
	}

	const repositories = await db
		.select()
		.from(repositoryTable)
		.where(
			and(eq(repositoryTable.installationId, installationId), eq(repositoryTable.userId, userId))
		)

	const removedRepositories = repositories.map((r) => r.id)

	const folderIds = await getFolderIdsByRepositoryIds(removedRepositories)
	const fileIds = await getFileIdsByRepositoryIds(removedRepositories)

	await dbPool.transaction(async (tx) => {
		// GH file and folder tables need to be delted before main table
		// Since the gh table has cascade set null on folderId and fileId
		await tx.delete(githubFolderTable).where(inArray(githubFolderTable.folderId, folderIds))
		await tx.delete(githubFileTable).where(inArray(githubFileTable.fileId, fileIds))

		await tx
			.delete(folderTable)
			.where(and(inArray(folderTable.id, folderIds), eq(folderTable.userId, userId)))
		await tx
			.delete(fileTable)
			.where(and(inArray(fileTable.id, fileIds), eq(fileTable.userId, userId)))

		await tx
			.delete(repositoryTable)
			.where(
				and(inArray(repositoryTable.id, removedRepositories), eq(repositoryTable.userId, userId))
			)

		await tx
			.delete(githubInstallationTable)
			.where(
				and(
					eq(githubInstallationTable.id, installationId),
					eq(githubInstallationTable.userId, userId)
				)
			)
	})

	return json({ success: true })
}

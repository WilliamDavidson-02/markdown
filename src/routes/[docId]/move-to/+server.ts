import { db, dbPool } from '$lib/db/index.js'
import { fileTable, folderTable, githubFileTable, githubFolderTable } from '$lib/db/schema'
import { json } from '@sveltejs/kit'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { moveToSchema } from './schema'
import { getGithubFolderByIds, getGithubRepoDataByFolderId } from '../queries'
import {
	createGithubTree,
	getFullTree,
	getGithubAccessToken,
	getGithubCommit,
	getGithubReference
} from '$lib/utilts/github'
import type { GithubTreePushFile } from '$lib/utilts/githubTypes'

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
	let token: string | null = null
	let installationData: {
		id: number
		repoId: number
	} | null = null

	if (github) {
		installationData = await getGithubRepoDataByFolderId(movingTo.id, user.id)
		if (!installationData) return json({ error: 'Installation not found' }, { status: 404 })

		token = await getGithubAccessToken(installationData.id)
	}

	if (target.type === 'folder') {
		const folders = await db
			.select()
			.from(folderTable)
			.where(
				and(inArray(folderTable.id, [target.id, movingTo.id]), eq(folderTable.userId, user.id))
			)

		if (folders.length !== 2) {
			return json({ error: 'Invalid request' }, { status: 400 })
		}

		await db.update(folderTable).set({ parentId: movingTo.id }).where(eq(folderTable.id, target.id))
	} else {
		const folder = await db.select().from(folderTable).where(eq(folderTable.id, movingTo.id))
		const file = await db.select().from(fileTable).where(eq(fileTable.id, target.id))

		if (folder.length !== 1 || file.length !== 1) {
			return json({ error: 'Invalid request' }, { status: 400 })
		}

		if (github && token && installationData) {
			const rootFolder = await db
				.select({ sha: githubFolderTable.sha, name: folderTable.name })
				.from(githubFolderTable)
				.where(
					and(
						eq(githubFolderTable.repositoryId, installationData.repoId),
						isNull(githubFolderTable.path)
					)
				)
				.innerJoin(folderTable, eq(githubFolderTable.folderId, folderTable.id))
				.limit(1)

			if (rootFolder.length === 0) {
				return json({ error: 'Root folder not found' }, { status: 404 })
			}

			const [owner, repo] = rootFolder[0].name?.split('/') ?? ['', '']
			const files: GithubTreePushFile[] = [
				{
					...file[0],
					path: movingTo.path,
					content: file[0].doc
				}
			]

			const newTree = await createGithubTree(owner, repo, [], files, rootFolder[0].sha, token)

			// Update the effected tree items sha's
			if (newTree) {
				await dbPool.transaction(async (tx) => {
					// Remove fk for old gh file, (The row will be deleted when pushing)
					const oldGhFile = await tx
						.update(githubFileTable)
						.set({ fileId: null })
						.where(eq(githubFileTable.fileId, target.id))
						.returning()

					await tx.insert(githubFileTable).values(
						newTree.tree.map((t) => ({
							repositoryId: oldGhFile[0].repositoryId,
							fileId: target.id,
							sha: t.sha,
							path: movingTo.path
						}))
					)

					// Update moved to folder sha
					const movedToFolder = newTree.tree.find((t) => t.type === 'tree')
					if (!movedToFolder) tx.rollback()
					await tx
						.update(githubFolderTable)
						.set({ sha: movedToFolder?.sha })
						.where(eq(githubFolderTable.folderId, movingTo.id))
				})
			}
		}

		await db.update(fileTable).set({ folderId: movingTo.id }).where(eq(fileTable.id, target.id))
	}

	return json({ success: true })
}

/**
 * Moving files create new blob insert new row with new path and sha, and update the previous row to remove fileId so it gets deleted when pushing
 * Moving a folder with out any files with in it then update the path but clear the sha for the new row
 * Moving a folder with files in it creates a new tree with all the nested folder and files with in the selected folder
 */

/**
 * To Create a new folder there must be atleast one files with in the children of the selected folder
 * If there is not just allow the move and create a new row with out a sha
 */

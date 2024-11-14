import {
	getFileIdsByRepositoryIds,
	getFolderIdsByRepositoryIds,
	formatGithubFiles,
	formatGithubFolders,
	getRepositoryFilesAndFolders
} from '$lib/utilts/github'
import { fail, superValidate } from 'sveltekit-superforms'
import type { Action } from '@sveltejs/kit'
import { zod } from 'sveltekit-superforms/adapters'
import { repositoriesSchema } from '../schemas'
import { v4 as uuid } from 'uuid'
import { insertNewRepository, removeRepository } from '../queries'

export const repositoriesAction: Action = async ({ request, locals }) => {
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
					...formatedFolders.map((f) => ({
						userId,
						id: f.id,
						name: f.name,
						parentId: f.parentId
					}))
				]

				formatedGithubFoldersData = [
					{ sha: rootSha, repositoryId: repository.id, folderId: repoFolder.id },
					...formatedGithubFoldersData
				]

				const { formatedFiles, formatedGithubFilesData } = formatGithubFiles(
					files,
					formatedFolders,
					repoFolder.id,
					repository.id
				)

				const filesToInsert = formatedFiles.map((f) => ({ ...f, userId }))

				const repositoryData = {
					id: repository.id,
					name: repository.full_name,
					fullName: repository.full_name,
					htmlUrl: repository.html_url,
					installationId,
					userId
				}

				await insertNewRepository(
					repositoryData,
					foldersToInsert,
					filesToInsert,
					formatedGithubFoldersData,
					formatedGithubFilesData
				)
			}
		}

		if (removedRepositories.length > 0) {
			const folderIds = await getFolderIdsByRepositoryIds(removedRepositories)
			const fileIds = await getFileIdsByRepositoryIds(removedRepositories)

			await removeRepository(userId, removedRepositories, folderIds, fileIds)
		}
	}

	return { form }
}

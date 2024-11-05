import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { fileTable, folderTable } from '$lib/db/schema.js'
import { buildTree, sortTreeByDate } from '$lib/utilts/tree'
import {
	createGithubPullRequest,
	createOrUpdateGithubFile,
	formatGithubFiles,
	formatGithubFolders,
	getAvailableRepositories,
	getFileIdsByRepositoryIds,
	getFolderIdsByRepositoryIds,
	getGithubAccessToken,
	getGithubRepository,
	getGithubRepositoryContent,
	getRepositoryFilesAndFolders,
	listAllBranches,
	mergeReposWithInstallation,
	type CreatePullRequestBodyParams
} from '$lib/utilts/github'
import { fileSchema, folderSchema, repositoriesSchema, repositoryBranchesSchema } from './schemas'
import { v4 as uuid } from 'uuid'
import {
	getAllFiles,
	getAllFolders,
	getCurrentDocById,
	getGithubFileById,
	getGithubFilesAndFoldersIds,
	getGithubInstallationIdByFileId,
	getGithubInstallations,
	getSelectedRepositories,
	getTrash,
	getUpdatedAtDoc,
	insertNewFile,
	insertNewFolder,
	insertNewRepository,
	removeRepository
} from './queries'
import type { File } from '$lib/components/file-tree/treeStore'
import type { GithubBranchListItem } from '$lib/utilts/githubTypes'
import { getFoldersToFilePos } from '$lib/utilts/helpers'
import { updateGithubFileShaAndPath } from '../github/git-pull/queries'

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		return redirect(302, `/`)
	}

	let currentDoc: (typeof fileTable.$inferSelect)[] | null = null
	const { docId } = params
	const userId = locals.user.id

	const trash = await getTrash(userId)
	const trashIds = trash.map((t) => t.fileId).filter((id) => id !== null)

	// Get the current doc
	if (docId && z.string().uuid().safeParse(docId).success) {
		currentDoc = await getCurrentDocById(userId, docId, trashIds)
		if (!currentDoc || currentDoc.length === 0) {
			currentDoc = await getUpdatedAtDoc(userId, trashIds)
		}
	} else {
		currentDoc = await getUpdatedAtDoc(userId, trashIds)
	}

	let files = await getAllFiles(userId)
	let folders = await getAllFolders(userId)

	const githubIds = await getGithubFilesAndFoldersIds(userId)

	let trashedFiles: File[] = []
	let trashedFolders: (typeof folderTable.$inferSelect)[] = []

	let githubFiles: File[] = []
	let githubFolders: (typeof folderTable.$inferSelect)[] = []

	files = files.filter((file) => {
		if (trash.some((t) => t.fileId === file.id)) {
			trashedFiles.push(file)
			return false
		} else if (githubIds.fileIds.includes(file.id)) {
			githubFiles.push(file)
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
		} else if (githubIds.folderIds.includes(folder.id)) {
			githubFolders.push(folder)
			return false
		} else if (folderInTrash) {
			trashedFolders.push(folder)
			return false
		}
		return true
	})

	const builtTree = buildTree(folders, files)
	const builtTrashedTree = buildTree(trashedFolders, trashedFiles)
	const builtGithubTree = buildTree(githubFolders, githubFiles)

	const rootFiles = files.filter((file) => !file.folderId)
	const tree = sortTreeByDate([...builtTree, ...rootFiles])

	const rootTrashedFiles = trashedFiles.filter(
		(file) => !file.folderId || !trashedFolders.some((f) => f.id === file.folderId)
	)
	const trashedTree = [...builtTrashedTree, ...rootTrashedFiles]

	const githubTree = sortTreeByDate(builtGithubTree)

	const installations = await getGithubInstallations(userId)
	const selectedRepositories = await getSelectedRepositories(
		userId,
		installations.map((i) => i.id)
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

	let repositoryBranches: GithubBranchListItem[] = []
	if (githubIds.fileIds.includes(currentDoc?.[0].id)) {
		const rootFolder = getFoldersToFilePos(builtGithubTree, currentDoc?.[0].id)[0]
		const installationId = mergedRepositories.find((r) =>
			r.repositories.some((repo) => repo.full_name === rootFolder?.name)
		)?.installationId
		if (rootFolder && installationId) {
			repositoryBranches = await listAllBranches(rootFolder.name ?? '', installationId)
		}
	}

	const fileForm = await superValidate(zod(fileSchema))
	const folderForm = await superValidate(zod(folderSchema))
	const repositoriesForm = await superValidate(
		zod(
			repositoriesSchema.default({
				installations: mergedRepositories
			})
		)
	)
	const repositoryBranchesForm = await superValidate(zod(repositoryBranchesSchema))

	return {
		currentDoc: currentDoc && currentDoc.length > 0 ? currentDoc[0] : null,
		tree,
		fileForm,
		folderForm,
		user: locals.user,
		trashedTree,
		installations,
		availableRepositories,
		repositoriesForm,
		githubTree,
		githubIds,
		repositoryBranchesForm,
		repositoryBranches
	}
}

export const actions: Actions = {
	file: async ({ request, locals }) => {
		const form = await superValidate(request, zod(fileSchema))
		const userId = locals.user?.id

		// The page is protected, so there should always be a user but just in case there isn't
		if (!userId || !form.valid) return fail(400, { form })

		const { icon, name, folderId } = form.data

		const fileData = { userId, icon, name: name.trim(), folderId }
		const file = await insertNewFile(fileData)

		return { form, id: file[0].id }
	},
	folder: async ({ request, locals }) => {
		const form = await superValidate(request, zod(folderSchema))
		const userId = locals.user?.id

		// The page is protected, so there should always be a user but just in case there isn't
		if (!userId || !form.valid) return fail(400, { form })

		const { name, parentId } = form.data

		const folderData = { userId, name: name.trim(), parentId }
		const folder = await insertNewFolder(folderData)

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
	},
	gitPush: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod(repositoryBranchesSchema))
		const userId = locals.user?.id
		const docId = params.docId

		if (!userId || !docId || !form.valid) return fail(400, { form })

		const { owner, repo, commitMessage, branch, createPullRequest, prDescription, prTitle } =
			form.data

		let file = await getGithubFileById(docId, userId)
		if (!file) return fail(404, { form })
		if (file.content) file.content = btoa(file.content)

		const installationId = await getGithubInstallationIdByFileId(docId, userId)
		if (!installationId) return fail(404, { form })

		const token = await getGithubAccessToken(installationId)
		if (!token) return fail(400, { form })

		const pathParams = { owner, repo, path: file.path ?? '' }

		const branchContent = await getGithubRepositoryContent(pathParams, branch, token)
		if (!branchContent) return fail(400, { form })

		const bodyParams = {
			message: commitMessage,
			content: file.content ?? '',
			sha: branchContent.sha ?? file.sha,
			branch
		}
		const updatedFile = await createOrUpdateGithubFile(pathParams, bodyParams, token)
		if (!updatedFile) return fail(400, { form })

		const repository = await getGithubRepository(owner, repo, token)
		if (repository && repository.default_branch === branch) {
			// Since we are pulling from the default branch
			// we only want to update the sha if we are pushing to the default branch
			await updateGithubFileShaAndPath([
				{
					sha: file.sha,
					path: file.path ?? '',
					newSha: updatedFile.content.sha,
					content: file.content ?? '',
					name: updatedFile.content.name,
					id: file.id
				}
			])
		}

		if (repository && repository.default_branch !== branch && createPullRequest) {
			const body: CreatePullRequestBodyParams = {
				title: prTitle,
				head: branch,
				base: repository.default_branch,
				body: prDescription
			}
			await createGithubPullRequest(pathParams, body, token)
		}

		return { form }
	}
}

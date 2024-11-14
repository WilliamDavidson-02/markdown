import type { Action } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { repositoryBranchesSchema } from '../schemas'
import {
	deleteGithubFiles,
	deleteGithubFolders,
	getGithubFileByIds,
	getGithubFolderByIds,
	getGithubRepoDataByFileId,
	getGithubRepoDataByFolderId,
	updateGithubFolderShaAndPath
} from '../queries'
import {
	createGithubCommit,
	createGithubPullRequest,
	createGithubTree,
	createOrUpdateGithubFile,
	getGithubAccessToken,
	getGithubCommit,
	getGithubReference,
	getGithubRepository,
	getGithubRepositoryContent,
	updateGithubReference,
	type CreatePullRequestBodyParams
} from '$lib/utilts/github'
import type {
	CreateGithubCommitBodyParams,
	GithubFileUpdate,
	GithubFolderData,
	GithubShaItemUpdate,
	GithubTreePushFile
} from '$lib/utilts/githubTypes'
import { updateGithubFileShaAndPath } from '../../github/git-pull/queries'

export const gitPushAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(repositoryBranchesSchema))
	const userId = locals.user?.id

	if (!userId || !form.valid) return fail(400, { form })

	const {
		owner,
		repo,
		commitMessage,
		branch,
		createPullRequest,
		prDescription,
		prTitle,
		selectedItem
	} = form.data

	const installationData =
		selectedItem.type === 'file'
			? await getGithubRepoDataByFileId(selectedItem.id, userId)
			: await getGithubRepoDataByFolderId(selectedItem.id, userId)
	if (!installationData) return fail(404, { form })

	const token = await getGithubAccessToken(installationData.id)
	if (!token) return fail(400, { form })

	const fileIds =
		selectedItem.type === 'folder' && selectedItem.childIds
			? selectedItem.childIds
			: [selectedItem.id]
	let files = await getGithubFileByIds(fileIds, userId, installationData.repoId)

	const folders = await getGithubFolderByIds(
		selectedItem.childIds ?? [],
		userId,
		installationData.repoId
	)

	let fileDataToUpdate: GithubFileUpdate[] = []
	let folderDataToUpdate: GithubShaItemUpdate[] = []

	if (selectedItem.type === 'file') {
		const file = files.find((f) => f.id === selectedItem.id)
		if (!file) return fail(404, { form })

		const pathParams = { owner, repo, path: file.path ?? '' }

		const branchContent = await getGithubRepositoryContent(pathParams, branch, token)
		if (!branchContent) return fail(400, { form })

		const bodyParams = {
			message: commitMessage,
			content: btoa(file.content ?? ''),
			sha: branchContent.sha ?? file.sha,
			branch
		}

		const updatedFile = await createOrUpdateGithubFile(pathParams, bodyParams, token)
		if (!updatedFile) return fail(400, { form })

		// File id and sha is possibly null when pushing multiple files
		// If a folder has been deleted, this is not relevent for a single file push
		if (file.id && file.sha) {
			fileDataToUpdate = [
				{
					sha: file.sha,
					path: file.path ?? '',
					newSha: updatedFile.content.sha,
					content: file.content ?? '',
					name: updatedFile.content.name,
					id: file.id
				}
			]
		}
	} else {
		// Get the latest commit sha for the branch
		const reference = await getGithubReference(owner, repo, branch, token)
		if (!reference) return fail(400, { form })

		const commit = await getGithubCommit(owner, repo, reference.object.sha, token)
		if (!commit) return fail(400, { form })

		const selectedFolder = folders.find((f) => f.id === selectedItem.id)
		const filteredFolders = folders.filter((f) => {
			if (f.path === null) return false
			if (selectedFolder?.path === null) return true
			return f.path.includes(selectedFolder?.path ?? '')
		})
		const filteredFiles = files.filter((f) => {
			if (selectedFolder?.path === null) return true
			return f.path?.includes(selectedFolder?.path ?? '')
		})

		const newTree = await createGithubTree(
			owner,
			repo,
			filteredFolders,
			filteredFiles,
			commit.tree.sha,
			token
		)
		if (!newTree) return fail(400, { form })

		const bodyParams: CreateGithubCommitBodyParams = {
			message: commitMessage,
			tree: newTree.sha,
			parents: [reference.object.sha]
		}
		const newCommit = await createGithubCommit(owner, repo, bodyParams, token)
		if (!newCommit) return fail(400, { form })

		const updatedReference = await updateGithubReference(owner, repo, branch, newCommit.sha, token)
		if (!updatedReference) return fail(400, { form })

		const [treeFilesToUpdate, treeFilesToDelete] = files.reduce(
			(prev, cur) => {
				prev[cur.sha ? 0 : 1].push(cur)
				return prev
			},
			[[], []] as GithubTreePushFile[][]
		)

		await deleteGithubFiles(treeFilesToDelete.map((f) => f.ghRowId ?? ''))

		fileDataToUpdate = treeFilesToUpdate.map((f) => {
			const name = f.path?.split('/').pop()?.replace('.md', '')
			const newSha = newTree.tree.find((t) => t.path === f.path)?.sha
			const sha = f.sha ?? ''
			return {
				sha,
				path: f.path ?? '',
				newSha: newSha ?? sha,
				content: f.content ?? '',
				name: name ?? '',
				id: f.id ?? ''
			}
		})

		const [treeFoldersToUpdate, treeFoldersToDelete] = folders.reduce(
			(prev, cur) => {
				prev[cur.sha ? 0 : 1].push(cur)
				return prev
			},
			[[], []] as GithubFolderData[][]
		)

		await deleteGithubFolders(treeFoldersToDelete.map((f) => f.ghRowId ?? ''))

		folderDataToUpdate = treeFoldersToUpdate.map((f) => {
			const name = f.path?.split('/').pop()
			const newSha = newTree.tree.find((t) => t.path === f.path)?.sha
			const sha = f.sha ?? ''
			return {
				sha,
				path: f.path ?? '',
				newSha: newSha ?? sha,
				name: name ?? '',
				id: f.id ?? ''
			}
		})
	}

	const repository = await getGithubRepository(owner, repo, token)
	if (repository && repository.default_branch === branch) {
		// Since we are pulling from the default branch
		// we only want to update the sha if we are pushing to the default branch
		await updateGithubFileShaAndPath(fileDataToUpdate)
		await updateGithubFolderShaAndPath(folderDataToUpdate)
	}

	if (repository && repository.default_branch !== branch && createPullRequest) {
		const body: CreatePullRequestBodyParams = {
			title: prTitle,
			head: branch,
			base: repository.default_branch,
			body: prDescription
		}
		await createGithubPullRequest({ owner, repo }, body, token)
	}

	return { form }
}

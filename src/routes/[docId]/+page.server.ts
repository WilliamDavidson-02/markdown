import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { fileTable, folderTable } from '$lib/db/schema.js'
import { buildTree, sortTreeByDate } from '$lib/utilts/tree'
import {
	createGithubCommit,
	createGithubPullRequest,
	createGithubTree,
	createOrUpdateGithubFile,
	formatGithubFiles,
	formatGithubFolders,
	getAvailableRepositories,
	getFileIdsByRepositoryIds,
	getFolderIdsByRepositoryIds,
	getGithubAccessToken,
	getGithubCommit,
	getGithubReference,
	getGithubRepository,
	getGithubRepositoryContent,
	getRepositoryFilesAndFolders,
	mergeReposWithInstallation,
	updateGithubReference,
	type CreatePullRequestBodyParams
} from '$lib/utilts/github'
import {
	editorSettingsSchema,
	emailSchema,
	fileSchema,
	folderSchema,
	keybindingSchema,
	passwordResetSchema,
	repositoriesSchema,
	repositoryBranchesSchema
} from './schemas'
import { v4 as uuid } from 'uuid'
import {
	getAllFiles,
	getAllFolders,
	getCurrentDocById,
	getGithubFileByIds,
	getGithubFilesAndFoldersIds,
	getGithubFolderByIds,
	getGithubInstallationIdByFileId,
	getGithubInstallationIdByFolderId,
	getGithubInstallations,
	getSelectedRepositories,
	getTrash,
	getUpdatedAtDoc,
	getUserByEmail,
	getEditorSettings,
	insertNewFile,
	insertNewFolder,
	insertNewRepository,
	removeRepository,
	updateGithubFolderShaAndPath,
	updateUserEmail,
	updateUserPassword,
	updateEditorSettings,
	findKeybinding,
	updateKeybinding,
	insertKeybinding,
	deleteKeybinding,
	getKeybindings
} from './queries'
import type { File } from '$lib/components/file-tree/treeStore'
import type {
	CreateGithubCommitBodyParams,
	GithubFileUpdate,
	GithubShaItemUpdate
} from '$lib/utilts/githubTypes'
import { updateGithubFileShaAndPath } from '../github/git-pull/queries'
import { hash, verify } from '@node-rs/argon2'

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		return redirect(302, `/`)
	}

	let currentDoc: (typeof fileTable.$inferSelect)[] | null = null
	const { docId } = params
	const userId = locals.user.id

	const editorSettings = await getEditorSettings(userId)
	const keybindings = (await getKeybindings(userId)).map((k) => ({
		key: k.key,
		name: k.name
	}))

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
	const passwordResetForm = await superValidate(zod(passwordResetSchema))
	const emailForm = await superValidate(zod(emailSchema))
	const editorSettingsForm = await superValidate(zod(editorSettingsSchema.default(editorSettings)))
	const keybindingForm = await superValidate(zod(keybindingSchema))

	return {
		currentDoc: currentDoc && currentDoc.length > 0 ? currentDoc[0] : null,
		tree,
		fileForm,
		folderForm,
		user: locals.user,
		editorSettings,
		trashedTree,
		installations,
		availableRepositories,
		repositoriesForm,
		githubTree,
		githubIds,
		repositoryBranchesForm,
		passwordResetForm,
		emailForm,
		editorSettingsForm,
		keybindingForm,
		keybindings
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
	gitPush: async ({ request, locals }) => {
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

		const installationId =
			selectedItem.type === 'file'
				? await getGithubInstallationIdByFileId(selectedItem.id, userId)
				: await getGithubInstallationIdByFolderId(selectedItem.id, userId)
		if (!installationId) return fail(404, { form })

		const token = await getGithubAccessToken(installationId)
		if (!token) return fail(400, { form })

		const fileIds =
			selectedItem.type === 'folder' && selectedItem.childIds
				? selectedItem.childIds
				: [selectedItem.id]
		let files = await getGithubFileByIds(fileIds, userId)
		if (files.length === 0) return fail(404, { form })

		const folders = (await getGithubFolderByIds(selectedItem.childIds ?? [], userId)).filter(
			(f) => f.path !== null
		)

		let fileDataToUpdate: GithubFileUpdate[] = []
		let folderDataToUpdate: GithubShaItemUpdate[] = []

		if (selectedItem.type === 'file') {
			const file = files[0]
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
		} else {
			// Get the latest commit sha for the branch
			const reference = await getGithubReference(owner, repo, branch, token)
			if (!reference) return fail(400, { form })

			const commit = await getGithubCommit(owner, repo, reference.object.sha, token)
			if (!commit) return fail(400, { form })

			const newTree = await createGithubTree(owner, repo, folders, files, commit.tree.sha, token)
			if (!newTree) return fail(400, { form })

			const bodyParams: CreateGithubCommitBodyParams = {
				message: commitMessage,
				tree: newTree.sha,
				parents: [reference.object.sha]
			}
			const newCommit = await createGithubCommit(owner, repo, bodyParams, token)
			if (!newCommit) return fail(400, { form })

			const updatedReference = await updateGithubReference(
				owner,
				repo,
				branch,
				newCommit.sha,
				token
			)
			if (!updatedReference) return fail(400, { form })

			fileDataToUpdate = files.map((f) => {
				const name = f.path?.split('/').pop()?.replace('.md', '')
				const newSha = newTree.tree.find((t) => t.path === f.path)?.sha
				return {
					sha: f.sha,
					path: f.path ?? '',
					newSha: newSha ?? f.sha,
					content: f.content ?? '',
					name: name ?? '',
					id: f.id
				}
			})

			folderDataToUpdate = folders.map((f) => {
				const name = f.path?.split('/').pop()
				const newSha = newTree.tree.find((t) => t.path === f.path)?.sha
				return {
					sha: f.sha,
					path: f.path ?? '',
					newSha: newSha ?? f.sha,
					name: name ?? '',
					id: f.id
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
	},
	passwordReset: async ({ request, locals }) => {
		const form = await superValidate(request, zod(passwordResetSchema))

		if (!locals.user || !form.valid) return fail(400, { form })
		const { currentPassword, newPassword } = form.data

		const existingUser = await getUserByEmail(locals.user.email)
		if (existingUser.length === 0) return fail(400, { form })

		const user = existingUser[0]
		const validPassword = await verify(user.passwordHash ?? '', currentPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		})
		if (!validPassword) {
			return fail(400, { form, error: 'Incorrect password' })
		}
		if (newPassword === currentPassword) {
			return fail(400, {
				form,
				error: 'New password cannot be the same as the current password'
			})
		}

		const newPasswordHash = await hash(newPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		})

		await updateUserPassword(user.id, newPasswordHash)

		return { form }
	},
	changeEmail: async ({ request, locals }) => {
		const form = await superValidate(request, zod(emailSchema))

		if (!locals.user || !form.valid) return fail(400, { form })

		const email = form.data.email.trim().toLowerCase()
		if (email === locals.user.email) return fail(400, { form, error: 'Email unchanged' })

		const existingUser = await getUserByEmail(email)
		if (existingUser.length > 0) return fail(400, { form, error: 'Email unavailable' })

		await updateUserEmail(locals.user.id, email)

		return { form }
	},
	editorSettings: async ({ request, locals }) => {
		const form = await superValidate(request, zod(editorSettingsSchema))

		if (!locals.user || !form.valid) return fail(400, { form })

		await updateEditorSettings(locals.user.id, form.data)

		return { form }
	},
	keybinding: async ({ request, locals }) => {
		const form = await superValidate(request, zod(keybindingSchema))
		const userId = locals.user?.id

		if (!userId || !form.valid) return fail(400, { form })

		const existingKeybinding = await findKeybinding(form.data.name, userId)

		if (form.data.reset) {
			if (existingKeybinding) await deleteKeybinding(form.data.name, userId)
			return { form }
		}

		if (existingKeybinding) {
			await updateKeybinding({ ...form.data, userId })
		} else {
			await insertKeybinding({ ...form.data, userId })
		}

		return { form }
	}
}

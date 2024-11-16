import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { redirect, type Actions } from '@sveltejs/kit'
import { fileTable, folderTable } from '$lib/db/schema.js'
import { buildTree, sortTreeByDate } from '$lib/utilts/tree'
import { getAvailableRepositories, mergeReposWithInstallation } from '$lib/utilts/github'
import {
	editorSettingsSchema,
	emailSchema,
	fileSchema,
	folderSchema,
	keybindingSchema,
	passwordResetSchema,
	renameSchema,
	repositoriesSchema,
	repositoryBranchesSchema
} from './schemas'
import {
	getAllFiles,
	getAllFolders,
	getCurrentDocById,
	getGithubFilesAndFoldersIds,
	getGithubInstallations,
	getSelectedRepositories,
	getTrash,
	getUpdatedAtDoc,
	getEditorSettings,
	getKeybindings
} from './queries'
import type { File } from '$lib/components/file-tree/treeStore'
import {
	changeEmailAction,
	editorSettingsAction,
	fileAction,
	folderAction,
	gitPushAction,
	keybindingAction,
	passwordResetAction,
	renameAction,
	repositoriesAction
} from './actions'

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
		} else if (folderInTrash) {
			trashedFolders.push(folder)
			return false
		} else if (githubIds.folderIds.includes(folder.id)) {
			githubFolders.push(folder)
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
	const renameForm = await superValidate(zod(renameSchema))

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
		keybindings,
		renameForm
	}
}

export const actions: Actions = {
	file: fileAction,
	folder: folderAction,
	repositories: repositoriesAction,
	gitPush: gitPushAction,
	passwordReset: passwordResetAction,
	changeEmail: changeEmailAction,
	editorSettings: editorSettingsAction,
	keybinding: keybindingAction,
	rename: renameAction
}

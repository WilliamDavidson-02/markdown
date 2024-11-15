import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { pullRequestSchema } from './schema'
import {
	deleteFoldersAndFiles,
	getInstallationIdByRootFolder,
	getRepositoryFiles,
	getRepositoryFolders,
	insertNewFilesAndFolders,
	restoreExistingItemsFromTrash,
	updateFileContents,
	updateFolderAndFileNames,
	updateFolderAndFilePaths,
	updateGithubFileShaAndPath,
	updateRootFolderSha
} from './queries'
import {
	getFullTree,
	getGithubAccessToken,
	filterTreeIntoStatus,
	getGithubFileContent,
	formatGithubFileBlob,
	formatGithubFolders,
	formatGithubFiles
} from '$lib/utilts/github'
import type { GithubBlob, GithubShaItemUpdate } from '$lib/utilts/githubTypes'

export const PUT = async ({ request, locals }) => {
	try {
		const userId = locals.user?.id
		if (!userId) return json({ success: false }, { status: 401 })

		const data: z.infer<typeof pullRequestSchema> = await request.json()
		if (!pullRequestSchema.safeParse(data).success) {
			return json({ success: false }, { status: 400 })
		}

		const { rootFolder, folderIds, fileIds, target } = data

		const installation = await getInstallationIdByRootFolder(rootFolder.id, userId)
		if (!installation) return json({ success: false }, { status: 400 })

		const token = await getGithubAccessToken(installation.installationId)
		if (!token) return json({ success: false }, { status: 400 })

		const repoFiles = await getRepositoryFiles(installation.repositoryId)
		const repoFolders = await getRepositoryFolders(installation.repositoryId)

		const treeData = await getFullTree(installation.installationId, rootFolder.name, token)
		if (!treeData) return json({ success: false }, { status: 400 })

		const filteredTree = filterTreeIntoStatus(
			treeData.tree,
			repoFolders.filter((f) => f.id !== rootFolder.id),
			repoFiles
		)

		const selectedFolders = repoFolders.filter((f) => folderIds.includes(f.id ?? ''))
		const selectedFiles = repoFiles.filter(
			(f) => fileIds.includes(f.id ?? '') && f.id !== rootFolder.id
		)

		if (filteredTree.existingItems.length > 0) {
			const itemsPathChanged = filteredTree.existingItems
				.filter((item) => {
					return (
						selectedFolders.find((f) => f.path !== item.path && f.sha === item.sha) ||
						selectedFiles.find((f) => f.path !== item.path && f.sha === item.sha)
					)
				})
				.reduce(
					(acc, item) => {
						const isFile = item.type === 'blob'
						const shaItem = {
							id:
								(isFile
									? selectedFiles.find((f) => f.sha === item.sha)?.id
									: selectedFolders.find((f) => f.sha === item.sha)?.id) ?? '',
							sha: item.sha,
							path: item.path,
							name: item.path.split('/').pop()?.replace('.md', '') || ''
						}
						isFile ? acc.files.push(shaItem) : acc.folders.push(shaItem)
						return acc
					},
					{ files: [] as GithubShaItemUpdate[], folders: [] as GithubShaItemUpdate[] }
				)

			await updateFolderAndFileNames(itemsPathChanged.files, itemsPathChanged.folders)
			await updateFolderAndFilePaths(itemsPathChanged.files, itemsPathChanged.folders)

			const toRequestNewContent = filteredTree.existingItems.filter((item) => {
				// Only checking for blob, since (md) files is alredy filtered from filterTreeIntoStatus
				if (item.type !== 'blob') return false
				// If the files path is the same but the sha is different, that means that the content with in the file has changed
				return selectedFiles.find((f) => f.path === item.path && f.sha !== item.sha)
			})

			if (toRequestNewContent.length > 0) {
				const blobs: GithubBlob[] = (
					await Promise.all(
						toRequestNewContent.map((item) => getGithubFileContent(item.url, token))
					)
				).filter((blob) => blob !== null) as GithubBlob[]
				const formatedFiles = blobs.map((blob: GithubBlob, index) => {
					const item = toRequestNewContent[index]
					const file = selectedFiles.find((f) => f.path === item.path && f.sha !== item.sha)
					const formatedFile = formatGithubFileBlob(blob, item)
					return {
						...formatedFile,
						id: file?.id ?? '',
						sha: file?.sha ?? '',
						newSha: formatedFile.sha
					}
				})

				await updateFileContents(formatedFiles)
				await updateGithubFileShaAndPath(formatedFiles)
			}

			// Restore items that exist but are in the trash and has not yet bin deleted
			const ids = filteredTree.existingItems
				.map((item) => {
					const file = repoFiles.find((f) => f.sha === item.sha || f.path === item.path)
					const folder = repoFolders.find((f) => f.sha === item.sha || f.path === item.path)
					return file?.id ?? folder?.id ?? ''
				})
				.filter((id) => id !== '')
			await restoreExistingItemsFromTrash(ids)
		}

		if (filteredTree.removedItems.length > 0) {
			const folders = filteredTree.removedItems.filter(
				(item) =>
					!item.path?.endsWith('.md') &&
					(selectedFolders.some((f) => f.id === item.id) || item.id === null)
			)
			const files = filteredTree.removedItems.filter(
				(item) =>
					item.path?.endsWith('.md') &&
					(selectedFiles.some((f) => f.id === item.id) || item.id === null)
			)

			await deleteFoldersAndFiles(folders, files, userId, installation.repositoryId)
		}

		if (filteredTree.newItems.length > 0) {
			const newFolders = filteredTree.newItems
				.filter(
					(item) =>
						item.type === 'tree' && (item.path.includes(target.path) || target.path.length === 0)
				)
				.map((f) => ({
					sha: f.sha,
					path: f.path
				}))
			const existingFolders = repoFolders
				.map((f) => ({ ...f, path: f.path ?? '' }))
				.filter((f) => f.id !== null)

			let { formatedFolders, formatedGithubFoldersData } = formatGithubFolders(
				[...existingFolders, ...newFolders],
				rootFolder.id,
				installation.repositoryId
			)

			const newFiles = filteredTree.newItems.filter(
				(item) =>
					item.type === 'blob' && (item.path.includes(target.path) || target.path.length === 0)
			)
			const blobs: GithubBlob[] = (
				await Promise.all(newFiles.map((item) => getGithubFileContent(item.url, token)))
			).filter((blob) => blob !== null)

			const files = blobs.map((blob: GithubBlob, index) =>
				formatGithubFileBlob(blob, newFiles[index])
			)

			let { formatedFiles, formatedGithubFilesData } = formatGithubFiles(
				files,
				formatedFolders,
				rootFolder.id,
				installation.repositoryId
			)

			// Remove alredy existing folders
			formatedFolders = formatedFolders.filter((f) => !existingFolders.some((ef) => ef.id === f.id))
			formatedGithubFoldersData = formatedGithubFoldersData.filter(
				(f) => !existingFolders.some((ef) => ef.id === f.folderId)
			)

			const foldersToInsert = formatedFolders.map((f) => ({ ...f, userId }))
			const filesToInsert = formatedFiles.map((f) => ({ ...f, userId }))

			await insertNewFilesAndFolders(
				foldersToInsert,
				filesToInsert,
				formatedGithubFoldersData,
				formatedGithubFilesData
			)
		}

		await updateRootFolderSha(rootFolder.id, treeData.sha)

		return json({ success: true })
	} catch (error) {
		return json({ success: false }, { status: 500 })
	}
}

/**
 * if rename folder or file only the parent sha changes
 * A files sha only changes when you update the content with in the file
 * A folders sha changes
 * -	when content in a child file changes
 * -	when renaming a child folder or file
 * -	when you add a new file to the folder
 * -	when you delete a file from the folder
 */

/**
 * if folder or file sha has not changed but the path to it has then update the name and path of the folder/file
 * if a files sha has changed but the path to it has not update the content of it
 * if a files sha and path does not exists (new file) then insert new file and get the parent folder id
 * if a folder sha and path does not exists (new folder) then insert new folder and get the parent folder id
 * if folder or file exists in db but not in tree (deleted) then delete the folder or file
 */

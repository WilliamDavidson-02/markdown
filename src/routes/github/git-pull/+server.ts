import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { pullRequestSchema } from './schema'
import {
	deleteFoldersAndFiles,
	getFileSha,
	getFolderSha,
	getInstallationIdByRootFolder,
	insertNewFilesAndFolders,
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

		const { rootFolder, folderIds, fileIds } = data

		const installation = await getInstallationIdByRootFolder(rootFolder.id, userId)
		if (!installation) return json({ success: false }, { status: 400 })

		const token = await getGithubAccessToken(installation.installationId)
		if (!token) return json({ success: false }, { status: 400 })

		const resFileSha = await getFileSha(fileIds, userId)
		const resFolderSha = await getFolderSha(folderIds, userId)

		const treeData = await getFullTree(installation.installationId, rootFolder.name, token)
		if (!treeData) return json({ success: false }, { status: 400 })

		const filteredTree = filterTreeIntoStatus(
			treeData.tree,
			resFolderSha.filter((f) => f.id !== rootFolder.id),
			resFileSha
		)

		if (filteredTree.existingItems.length > 0) {
			const itemsPathChanged = filteredTree.existingItems
				.filter((item) => {
					return (
						resFolderSha.find((f) => f.path !== item.path && f.sha === item.sha) ||
						resFileSha.find((f) => f.path !== item.path && f.sha === item.sha)
					)
				})
				.reduce(
					(acc, item) => {
						const isFile = item.type === 'blob'
						const shaItem = {
							id:
								(isFile
									? resFileSha.find((f) => f.sha === item.sha)?.id
									: resFolderSha.find((f) => f.sha === item.sha)?.id) ?? '',
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
				return resFileSha.find((f) => f.path === item.path && f.sha !== item.sha)
			})

			if (toRequestNewContent.length > 0) {
				const blobs: GithubBlob[] = (
					await Promise.all(
						toRequestNewContent.map((item) => getGithubFileContent(item.url, token))
					)
				).filter((blob) => blob !== null) as GithubBlob[]
				const formatedFiles = blobs.map((blob: GithubBlob, index) => {
					const item = toRequestNewContent[index]
					const file = resFileSha.find((f) => f.path === item.path && f.sha !== item.sha)
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
		}

		if (filteredTree.newItems.length > 0) {
			const newFolders = filteredTree.newItems
				.filter((item) => item.type === 'tree')
				.map((f) => ({
					sha: f.sha,
					path: f.path
				}))
			const existingFolders = resFolderSha.map((f) => ({ ...f, path: f.path ?? '' }))

			let { formatedFolders, formatedGithubFoldersData } = formatGithubFolders(
				[...existingFolders, ...newFolders],
				rootFolder.id,
				installation.repositoryId
			)

			const newFiles = filteredTree.newItems.filter((item) => item.type === 'blob')
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

		if (filteredTree.removedItems.length > 0) {
			const folders = filteredTree.removedItems.filter((item) => !item.path?.endsWith('.md'))
			const files = filteredTree.removedItems.filter((item) => item.path?.endsWith('.md'))

			await deleteFoldersAndFiles(folders, files, userId)
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
import { GITHUB_APP_ID, GITHUB_PRIVATE_KEY } from '$env/static/private'
import {
	fileTable,
	folderTable,
	githubFileTable,
	githubFolderTable,
	type repositoryTable
} from '$lib/db/schema'
import jwt from 'jsonwebtoken'
import type {
	GithubBlob,
	GithubFile,
	GithubFolder,
	GithubFolderData,
	GithubFormatedFile,
	GithubTreeItem
} from './githubTypes'
import { v4 as uuid } from 'uuid'
import { db } from '$lib/db'
import { eq, inArray } from 'drizzle-orm'

export const generateGitHubJWT = () => {
	const privateKey = GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n')

	const now = Math.floor(Date.now() / 1000)
	const payload = {
		iat: now,
		exp: now + 10 * 60,
		iss: GITHUB_APP_ID
	}

	return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}

export type GitHubRepository = {
	id: number
	name: string
	full_name: string
	html_url: string
}

export const getAvailableRepositories = async (
	installationId: number
): Promise<GitHubRepository[]> => {
	try {
		const jwtToken = generateGitHubJWT()

		const tokenResponse = await fetch(
			`https://api.github.com/app/installations/${installationId}/access_tokens`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwtToken}`,
					Accept: 'application/vnd.github+json'
				}
			}
		)

		if (!tokenResponse.ok) return []

		const tokenData = await tokenResponse.json()

		let page = 1
		const repositories: GitHubRepository[] = []

		while (true) {
			const response = await fetch(
				`https://api.github.com/installation/repositories?per_page=100&page=${page}`,
				{
					headers: {
						Authorization: `Bearer ${tokenData.token}`,
						Accept: 'application/vnd.github+json'
					}
				}
			)

			if (!response.ok) break

			const data = await response.json()
			repositories.push(
				...data.repositories.map((repo: GitHubRepository) => ({
					id: repo.id,
					name: repo.name,
					full_name: repo.full_name,
					html_url: repo.html_url
				}))
			)

			if (data.repositories.length < 100) break
			page++
		}

		return repositories
	} catch {
		return []
	}
}

export const getRepositoryFilesAndFolders = async (
	installationId: number,
	repository: GitHubRepository
): Promise<{ files: GithubFile[]; folders: GithubFolderData[]; rootSha: string }> => {
	const returnDefault = { files: [], folders: [], rootSha: '' }
	try {
		const jwtToken = generateGitHubJWT()

		const tokenResponse = await fetch(
			`https://api.github.com/app/installations/${installationId}/access_tokens`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwtToken}`,
					Accept: 'application/vnd.github+json'
				}
			}
		)

		if (!tokenResponse.ok) return returnDefault
		const tokenData = await tokenResponse.json()

		const treeResponse = await fetch(
			`https://api.github.com/repos/${repository.full_name}/git/trees/main?recursive=1`,
			{
				headers: {
					Authorization: `Bearer ${tokenData.token}`,
					Accept: 'application/vnd.github+json'
				}
			}
		)

		if (!treeResponse.ok) return returnDefault
		const treeData = await treeResponse.json()

		if (treeData.tree.length === 0) return returnDefault

		// Fetch all md files content
		const mdFiles = treeData.tree.filter((item: GithubTreeItem) => item.path.endsWith('.md'))
		const blobs = await Promise.all(
			mdFiles.map((item: GithubTreeItem) =>
				fetch(item.url, {
					headers: {
						Authorization: `Bearer ${tokenData.token}`,
						Accept: 'application/vnd.github+json'
					}
				}).then((res) => res.json())
			)
		)

		const formatedFiles = blobs.map((blob: GithubBlob, index) => {
			const treeItem: GithubTreeItem = mdFiles[index]
			const name = treeItem.path.split('/').pop()?.replace('.md', '') ?? ''
			return {
				sha: treeItem.sha,
				path: treeItem.path,
				content: atob(blob.content),
				name
			}
		})

		// Filter all folders that are included in the files paths
		const treeFolders: GithubFolderData[] = treeData.tree
			.filter(
				(item: GithubTreeItem) =>
					item.type === 'tree' && formatedFiles.some((f) => f.path.includes(item.path))
			)
			.map((f: GithubTreeItem) => ({
				sha: f.sha,
				path: f.path
			}))

		return { files: formatedFiles, folders: treeFolders, rootSha: treeData.sha }
	} catch {
		return returnDefault
	}
}

export const formatGithubFolders = (
	ghFolderData: GithubFolderData[],
	rootFolderId: string,
	repoId: number
) => {
	const formatedFolders: GithubFolder[] = []
	const formatedGithubFoldersData: (typeof githubFolderTable.$inferInsert)[] = []

	for (const folder of ghFolderData) {
		const folderId = uuid()

		formatedFolders.push({
			id: folderId,
			name: folder.path.split('/').pop() ?? '',
			// Github folders are returned in order of the path from the api
			// that is why we can use the last folder as a parent
			parentId:
				formatedFolders.length > 0 && folder.path.includes('/')
					? formatedFolders[formatedFolders.length - 1].id
					: rootFolderId
		})

		formatedGithubFoldersData.push({
			id: folder.sha,
			repositoryId: repoId,
			folderId
		})
	}

	return { formatedFolders, formatedGithubFoldersData }
}

export const formatGithubFiles = (
	files: GithubFile[],
	folders: GithubFolder[],
	rootFolderId: string,
	repoId: number
) => {
	const formatedFiles: GithubFormatedFile[] = []
	const formatedGithubFilesData: (typeof githubFileTable.$inferInsert)[] = []

	for (const file of files) {
		const folderNames = file.path.split('/').slice(0, -1)
		// To prevent the wrong directory, we find the first folder and match the rest of the folder names
		const firstFolderIndex = folders.findIndex((f, i) => {
			if (f.name !== folderNames[0]) return false
			const folderSlice = folders.slice(i, i + folderNames.length)
			return folderSlice.every((f, index) => f.name === folderNames[index])
		})

		const pathFolders = folders.slice(firstFolderIndex, firstFolderIndex + folderNames.length)
		const folder = pathFolders.at(-1)

		const fileId = uuid()

		formatedFiles.push({
			id: fileId,
			name: file.name,
			icon: 'File',
			doc: file.content,
			folderId: folder?.id ?? rootFolderId
		})

		formatedGithubFilesData.push({
			id: file.sha,
			repositoryId: repoId,
			fileId
		})
	}

	return { formatedFiles, formatedGithubFilesData }
}

export const mergeReposWithInstallation = (
	repositories: (typeof repositoryTable.$inferSelect)[],
	installationId: number
) => {
	const installationRepositories = repositories
		.filter((repo) => repo.installationId === installationId)
		.map((repo) => ({
			id: repo.id,
			name: repo.name,
			full_name: repo.fullName,
			html_url: repo.htmlUrl
		}))

	return {
		installationId,
		repositories: installationRepositories,
		removedRepositories: []
	}
}

export const getFolderIdsByRepositoryIds = async (ids: number[]) => {
	const folders = await db
		.select({ id: folderTable.id })
		.from(folderTable)
		.innerJoin(githubFolderTable, eq(folderTable.id, githubFolderTable.folderId))
		.where(inArray(githubFolderTable.repositoryId, ids))

	return folders.map((f) => f.id)
}

export const getFileIdsByRepositoryIds = async (ids: number[]) => {
	const files = await db
		.select({ id: fileTable.id })
		.from(fileTable)
		.innerJoin(githubFileTable, eq(fileTable.id, githubFileTable.fileId))
		.where(inArray(githubFileTable.repositoryId, ids))

	return files.map((f) => f.id)
}

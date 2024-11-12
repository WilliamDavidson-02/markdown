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
	CreateGithubCommitBodyParams,
	CreateGithubTree,
	CreateGithubTreeItem,
	CreateOrUpdateGithubFile,
	GithubBlob,
	GithubBranchListItem,
	GithubCommit,
	GithubFile,
	GithubFolder,
	GithubFolderData,
	GithubFormatedFile,
	GithubReference,
	GithubRepository,
	GithubRepositoryContent,
	GithubShaItem,
	GithubTree,
	GithubTreeItem,
	GithubTreePushFile
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

export const getGithubAccessToken = async (installationId: number): Promise<string | null> => {
	const jwtToken = generateGitHubJWT()

	const response = await fetch(
		`https://api.github.com/app/installations/${installationId}/access_tokens`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${jwtToken}`,
				Accept: 'application/vnd.github+json'
			}
		}
	)

	return response.ok ? (await response.json()).token : null
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
		const token = await getGithubAccessToken(installationId)
		if (!token) return []

		let page = 1
		const repositories: GitHubRepository[] = []

		while (true) {
			const response = await fetch(
				`https://api.github.com/installation/repositories?per_page=100&page=${page}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
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

		return repositories.reverse()
	} catch {
		return []
	}
}

export const getFullTree = async (
	installationId: number,
	repository: string,
	token?: string
): Promise<GithubTree | null> => {
	let tokenData = token

	if (!tokenData) {
		const token = await getGithubAccessToken(installationId)
		if (!token) return null
		tokenData = token
	}

	const response = await fetch(
		`https://api.github.com/repos/${repository}/git/trees/main?recursive=1`,
		{
			headers: {
				Authorization: `Bearer ${tokenData}`,
				Accept: 'application/vnd.github+json'
			}
		}
	)

	return response.ok ? await response.json() : null
}

export const getGithubFileContent = async (
	url: string,
	token: string
): Promise<GithubBlob | null> => {
	try {
		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json'
			}
		})
		return res.ok ? await res.json() : null
	} catch {
		return null
	}
}

export const formatGithubFileBlob = (blob: GithubBlob, treeItem: GithubTreeItem) => {
	const name = treeItem.path.split('/').pop()?.replace('.md', '') ?? ''
	return {
		sha: treeItem.sha,
		path: treeItem.path,
		content: atob(blob.content),
		name
	}
}

export const getRepositoryFilesAndFolders = async (
	installationId: number,
	repository: GitHubRepository
): Promise<{ files: GithubFile[]; folders: GithubFolderData[]; rootSha: string }> => {
	const returnDefault = { files: [], folders: [], rootSha: '' }
	try {
		const token = await getGithubAccessToken(installationId)
		if (!token) return returnDefault

		const treeData = await getFullTree(installationId, repository.full_name, token)
		if (!treeData) return returnDefault

		if (treeData.tree.length === 0) return returnDefault

		// Fetch all md files content
		const mdFiles = treeData.tree.filter((item) => item.path.endsWith('.md'))
		const blobs: GithubBlob[] = (
			await Promise.all(mdFiles.map((item) => getGithubFileContent(item.url, token)))
		).filter((blob) => blob !== null)

		const formatedFiles = blobs.map((blob: GithubBlob, index) =>
			formatGithubFileBlob(blob, mdFiles[index])
		)

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

	const foldersWithPath: { path: string; id: string }[] = []

	for (const folder of ghFolderData) {
		const folderId = folder.id ?? uuid()

		const parentPath = folder.path?.split('/').slice(0, -1).join('/') ?? ''
		const parentId = foldersWithPath.find((f) => f.path === parentPath)?.id ?? rootFolderId

		formatedFolders.push({
			id: folderId,
			name: folder.path?.split('/').pop() ?? '',
			parentId,
			path: folder.path ?? ''
		})

		foldersWithPath.push({ path: folder.path ?? '', id: folderId })

		formatedGithubFoldersData.push({
			sha: folder.sha ?? '',
			repositoryId: repoId,
			folderId,
			path: folder.path
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
		const parentPath = file.path.split('/').slice(0, -1).join('/')
		const parentId = folders.find((f) => f.path === parentPath)?.id ?? rootFolderId

		const fileId = uuid()

		formatedFiles.push({
			id: fileId,
			name: file.name,
			icon: 'File',
			doc: file.content,
			folderId: parentId
		})

		formatedGithubFilesData.push({
			sha: file.sha,
			repositoryId: repoId,
			fileId,
			path: file.path
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

export const filterTreeIntoStatus = (
	tree: GithubTreeItem[],
	folders: GithubShaItem[],
	files: GithubShaItem[]
) => {
	const mdFiles = tree.filter((item) => item.path.endsWith('.md'))
	const mdFolders = tree.filter(
		(item) => item.type === 'tree' && mdFiles.some((f) => f.path.includes(item.path))
	)

	const validTreeItems = [...mdFolders, ...mdFiles]

	const removedItems = [...folders, ...files].filter(
		(item) => !validTreeItems.some((t) => t.sha === item.sha || t.path === item.path)
	)

	const newItems = validTreeItems.filter(
		(item) =>
			!folders.some((f) => f.sha === item.sha || f.path === item.path) &&
			!files.some((f) => f.sha === item.sha || f.path === item.path)
	)

	const existingItems = validTreeItems.filter(
		(item) =>
			folders.some((f) => f.sha === item.sha || f.path === item.path) ||
			files.some((f) => f.sha === item.sha || f.path === item.path)
	)

	return { removedItems, newItems, existingItems }
}

export const listAllBranches = async (
	fullName: string,
	installationId: number
): Promise<GithubBranchListItem[]> => {
	const token = await getGithubAccessToken(installationId)
	if (!token) return []

	const res = await fetch(`https://api.github.com/repos/${fullName}/branches`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		}
	})

	return res.ok ? await res.json() : []
}

type PathParams = {
	owner: string
	repo: string
	path: string
}
type BodyParams = {
	message: string
	content: string
	sha?: string
	branch?: string
}
export const createOrUpdateGithubFile = async (
	pathParams: PathParams,
	bodyParams: BodyParams,
	token: string | null
): Promise<CreateOrUpdateGithubFile | null> => {
	if (!token) return null

	const { owner, repo, path } = pathParams
	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		},
		body: JSON.stringify(bodyParams)
	})

	return res.ok ? await res.json() : null
}

export const getGithubRepositoryContent = async (
	pathParams: PathParams,
	branch: string,
	token: string | null
): Promise<GithubRepositoryContent | null> => {
	if (!token) return null

	const { owner, repo, path } = pathParams
	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json'
			}
		}
	)

	return res.ok ? await res.json() : null
}

export const getGithubRepository = async (
	owner: string,
	repo: string,
	token: string
): Promise<GithubRepository | null> => {
	if (!token) return null

	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		}
	})

	return res.ok ? await res.json() : null
}

export type CreatePullRequestBodyParams = {
	title?: string
	head: string
	head_repo?: string
	base: string
	body?: string
	maintainer_can_modify?: boolean
	draft?: boolean
	issue?: number
}
type CreatePullRequestPathParams = {
	owner: string
	repo: string
}
export const createGithubPullRequest = async (
	pathParams: CreatePullRequestPathParams,
	bodyParams: CreatePullRequestBodyParams,
	token: string | null
) => {
	if (!token) return null

	const res = await fetch(
		`https://api.github.com/repos/${pathParams.owner}/${pathParams.repo}/pulls`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json'
			},
			body: JSON.stringify(bodyParams)
		}
	)

	return res.ok ? await res.json() : null
}

export const getGithubReference = async (
	owner: string,
	repo: string,
	branch: string,
	token: string
): Promise<GithubReference | null> => {
	if (!token) return null

	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json'
			}
		}
	)

	return res.ok ? await res.json() : null
}

export const updateGithubReference = async (
	owner: string,
	repo: string,
	branch: string,
	sha: string,
	token: string
): Promise<GithubReference | null> => {
	if (!token) return null

	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json'
			},
			body: JSON.stringify({ sha })
		}
	)

	return res.ok ? await res.json() : null
}

export const getGithubCommit = async (
	owner: string,
	repo: string,
	sha: string,
	token: string
): Promise<GithubCommit | null> => {
	if (!token) return null

	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${sha}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		}
	})

	return res.ok ? await res.json() : null
}

export const createGithubTree = async (
	owner: string,
	repo: string,
	folders: GithubFolderData[],
	files: GithubTreePushFile[],
	baseTreeSha: string,
	token: string
): Promise<GithubTree | null> => {
	if (!token) return null

	const formatedFolders = folders.map((f) => ({
		path: f.path ?? '',
		mode: '040000',
		type: 'tree',
		sha: f.sha
	}))

	const formatedFiles = files.map((f) => {
		const base: CreateGithubTreeItem = {
			path: f.path ?? '',
			mode: '100644',
			type: 'blob'
		}

		// If content is provided, use content. Otherwise, use sha
		// It's not possible to propvide both sha and content, you will get a 422 response
		return f.content ? { ...base, content: f.content } : { ...base, sha: f.sha }
	})

	const tree: CreateGithubTree = {
		tree: [...formatedFolders, ...formatedFiles],
		base_tree: baseTreeSha
	}

	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		},
		body: JSON.stringify(tree)
	})

	const newTree = await res.json()

	return res.ok ? newTree : null
}

export const createGithubCommit = async (
	owner: string,
	repo: string,
	bodyParams: CreateGithubCommitBodyParams,
	token: string
): Promise<GithubCommit | null> => {
	if (!token) return null

	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		},
		body: JSON.stringify(bodyParams)
	})

	return res.ok ? await res.json() : null
}

export const deleteGithubInstallation = async (installationId: number, token: string) => {
	if (!token) return null

	const res = await fetch(`https://api.github.com/app/installations/${installationId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json'
		}
	})

	return res.ok
}

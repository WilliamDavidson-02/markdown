export type GithubTreeItem = {
	path: string
	mode: string
	type: string
	sha: string
	size?: number
	url: string
}

export type GithubTree = {
	sha: string
	url: string
	tree: GithubTreeItem[]
	truncated: boolean
}

export type GithubBlob = {
	sha: string
	node_id: string
	size: number
	url: string
	content: string
	encoding: string
}

export type GithubFolder = {
	id: string
	name: string
	parentId: string
	path?: string
}

export type GithubFolderData = {
	id?: string
	sha: string
	path: string
}

export type GithubFile = {
	sha: string
	path: string
	content: string
	name: string
}

export type GithubFormatedFile = {
	id: string
	name: string
	icon: string
	doc: string
	folderId: string | undefined
}

export type GithubShaItem = {
	id: string
	sha: string
	path: string | null | undefined
}

export type GithubShaItemUpdate = GithubShaItem & {
	name: string
}

export type GithubFileUpdate = GithubFile & {
	id: string
	newSha: string
}

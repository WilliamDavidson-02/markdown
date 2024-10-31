export type GithubTreeItem = {
	path: string
	mode: string
	type: string
	sha: string
	size?: number
	url: string
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
}

export type GithubFolderData = {
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

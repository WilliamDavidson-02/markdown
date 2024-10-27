import type { Folder } from '$lib/components/file-tree/treeStore'

export const getWordCount = (value: string) => {
	const wordBoundaries = value.match(/\b\w+\b/g)
	return wordBoundaries ? wordBoundaries.length : 0
}

export const getCharacterCount = (value: string) => {
	return value.replace(/\s/g, '').length
}

export const getChildIds = (folder: Folder): string[] => {
	return [...folder.files.map((file) => file.id), ...folder.children.map((c) => c.id)]
}

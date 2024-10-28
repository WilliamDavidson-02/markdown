import type { Folder } from '$lib/components/file-tree/treeStore'

export const getWordCount = (value: string) => {
	const wordBoundaries = value.match(/\b\w+\b/g)
	return wordBoundaries ? wordBoundaries.length : 0
}

export const getCharacterCount = (value: string) => {
	return value.replace(/\s/g, '').length
}

export const getNestedIds = (folders: Folder[]): string[] => {
	const traverse = (folders: Folder[]): string[] => {
		const newIds: string[] = []
		for (const folder of folders) {
			newIds.push(folder.id)
			if (folder.files.length > 0) {
				newIds.push(...folder.files.map((file) => file.id))
			}
			if (folder.children.length > 0) {
				newIds.push(...traverse(folder.children))
			}
		}
		return newIds
	}
	return traverse(folders)
}

export const getNestedFileIds = (folders: Folder[]): string[] => {
	const traverse = (folders: Folder[]): string[] => {
		const newIds: string[] = []
		for (const folder of folders) {
			if (folder.files.length > 0) {
				newIds.push(...folder.files.map((file) => file.id))
			}
			if (folder.children.length > 0) {
				newIds.push(...traverse(folder.children))
			}
		}
		return newIds
	}
	return traverse(folders)
}

export const getNestedFolderIds = (folders: Folder[]): string[] => {
	const traverse = (folders: Folder[]): string[] => {
		const newIds: string[] = []
		for (const folder of folders) {
			newIds.push(folder.id)

			if (folder.children.length > 0) {
				newIds.push(...traverse(folder.children))
			}
		}
		return newIds
	}
	return traverse(folders)
}

export const findFolderById = (folders: Folder[], id: string): Folder | null => {
	const traverse = (folders: Folder[]): Folder | null => {
		let found: Folder | null = null
		for (const folder of folders) {
			if (folder.id === id) return folder
			if (folder.children.length > 0) {
				found = traverse(folder.children)
				if (found) return found
			}
		}
		return found
	}
	return traverse(folders)
}

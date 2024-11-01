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

export const getAllFolders = (folders: Folder[]): Folder[] => {
	const traverse = (folders: Folder[]): Folder[] => {
		const newFolders: Folder[] = []
		for (const folder of folders) {
			newFolders.push(folder)

			if (folder.children.length > 0) {
				newFolders.push(...traverse(folder.children))
			}
		}
		return newFolders
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

export const getFoldersToFilePos = (folders: Folder[], id: string): Folder[] => {
	const traverse = (folders: Folder[]): Folder[] | null => {
		for (const folder of folders) {
			if (folder.files.some((file) => file.id === id)) {
				return [folder]
			}

			if (folder.children.length > 0) {
				const childResult = traverse(folder.children)
				if (childResult) {
					return [folder, ...childResult]
				}
			}
		}
		return null
	}
	return traverse(folders) || []
}

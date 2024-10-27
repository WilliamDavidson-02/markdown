import type { File, Folder } from '$lib/components/file-tree/treeStore'
import type { fileTable, folderTable } from '$lib/db/schema'
import { getDaysDifference } from './date'

export const isFolder = (item: Folder | File): item is Folder => 'children' in item

export const buildTree = (
	folders: (typeof folderTable.$inferSelect)[],
	files: (typeof fileTable.$inferSelect)[]
) => {
	let folderTree: Folder[] = []
	const folderMap = new Map<string, Folder>()

	for (const folder of folders) {
		const filesInFolder = files.filter((file) => file.folderId === folder.id)

		folderMap.set(folder.id, {
			...folder,
			children: [],
			/** Files are ordered desc so the first files is the last updated */
			updatedAt: filesInFolder.length > 0 ? filesInFolder[0].updatedAt : folder.createdAt,
			files: filesInFolder
		})
	}

	for (const folder of folders) {
		const folderWithChildren = folderMap.get(folder.id)!
		const parent = folder.parentId ? folderMap.get(folder.parentId) : null
		if (parent) {
			parent.updatedAt =
				folderWithChildren.updatedAt > parent.updatedAt
					? folderWithChildren.updatedAt
					: parent.updatedAt
			parent.children.push(folderWithChildren)
		} else {
			folderTree.push(folderWithChildren)
		}
	}

	return folderTree
}

export const sortTreeByDate = (items: (Folder | File)[]) => {
	const groups: (Folder | File)[][] = []

	for (const item of items) {
		const diffDays = getDaysDifference(item.updatedAt)
		const daysSinceNewYear = getDaysDifference(new Date(`${new Date().getFullYear()}-01-01`))

		if (diffDays === 0) {
			groups[0] = [...(groups[0] || []), item]
		} else if (diffDays <= 7) {
			groups[1] = [...(groups[1] || []), item]
		} else if (diffDays <= 30) {
			groups[2] = [...(groups[2] || []), item]
		} else if (diffDays <= daysSinceNewYear) {
			const basedMonthIndex = Math.floor(diffDays / 30) + 2 // +2 30 days last group index
			groups[basedMonthIndex] = [...(groups[basedMonthIndex] || []), item]
		} else {
			const basedMonthIndex = Math.floor(diffDays / 365) + 11 // +11 months last group index
			groups[basedMonthIndex] = [...(groups[basedMonthIndex] || []), item]
		}
	}

	return groups
		.filter((g) => g && g.length > 0) // Filter empty slots
		.map((g) =>
			g.sort((a, b) => {
				if (isFolder(a) && !isFolder(b)) return -1 // Folder before file
				if (!isFolder(a) && isFolder(b)) return 1 // File before folder
				return b.updatedAt.getTime() - a.updatedAt.getTime()
			})
		)
}

import type { File, Folder, Tree } from '$lib/components/file-tree/treeStore'
import type { z } from 'zod'
import type { moveToSchema } from '../../../routes/[docId]/move-to/schema'
import { isFolder } from '$lib/utilts/tree'
import {
	getFoldersToFilePos,
	getFoldersToFolderPos,
	getNestedFileIds,
	getNestedFolderIds
} from '$lib/utilts/helpers'

export const formatMoveTo = (
	folder: Folder,
	target: Folder | File,
	ghTree: Tree,
	ghFolderIds: string[]
) => {
	let path = ''
	let nestedFileIds: z.infer<typeof moveToSchema>['target']['children']['fileIds'] = []
	let nestedFolderIds: z.infer<typeof moveToSchema>['target']['children']['folderIds'] = []

	const targetType = isFolder(target) ? 'folder' : 'file'

	if (ghFolderIds.includes(folder.id)) {
		const rootFolders = ghTree.flat().filter((i) => isFolder(i))
		const dirs = [
			...getFoldersToFolderPos(rootFolders, folder.id)
				.slice(1)
				.map((i) => i.name),
			target.name
		]

		path = dirs.join('/')

		if (targetType === 'file') {
			path += '.md'
		}

		const fileIds = getNestedFileIds(isFolder(target) ? [target] : [])

		for (const id of fileIds) {
			let dirs = getFoldersToFilePos([target as Folder], id).map((i) => i.name)

			if (!rootFolders.some((f) => f.id === folder.id)) {
				dirs = [folder.name, ...dirs]
			}

			nestedFileIds.push({ id, path: dirs.join('/') })
		}

		let folderIds = getNestedFolderIds(isFolder(target) ? [target] : [])

		for (const id of folderIds) {
			let dirs = getFoldersToFolderPos([target as Folder], id).map((i) => i.name)

			if (!rootFolders.some((f) => f.id === folder.id)) {
				dirs = [folder.name, ...dirs]
			}

			nestedFolderIds.push({ id, path: dirs.join('/') })
		}
	}

	const body: z.infer<typeof moveToSchema> = {
		target: {
			id: target.id,
			type: targetType,
			children: {
				folderIds: nestedFolderIds,
				fileIds: nestedFileIds
			}
		},
		movingTo: { id: folder.id, path },
		github: ghFolderIds.includes(folder.id)
	}

	return body
}

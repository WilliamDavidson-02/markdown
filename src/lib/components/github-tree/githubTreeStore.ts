import { writable } from 'svelte/store'
import type { MoveToDialog, Tree } from '../file-tree/treeStore'

export const githubTree = writable<Tree>([])
export const githubIds = writable<{ fileIds: string[]; folderIds: string[] }>({
	fileIds: [],
	folderIds: []
})

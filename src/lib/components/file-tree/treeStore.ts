import type { fileTable, folderTable } from '$lib/db/schema'
import { writable } from 'svelte/store'

export type File = typeof fileTable.$inferSelect
export type Folder = typeof folderTable.$inferSelect & {
	children: Folder[]
	updatedAt: Date
	files: File[]
}
export type Tree = (File | Folder)[][]

export const treeStore = writable<Tree>([])

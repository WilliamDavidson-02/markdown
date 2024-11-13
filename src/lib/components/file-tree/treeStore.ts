import type { fileTable, folderTable } from '$lib/db/schema'
import { writable } from 'svelte/store'

export type File = typeof fileTable.$inferSelect
export type Folder = typeof folderTable.$inferSelect & {
	children: Folder[]
	updatedAt: Date
	files: File[]
}
export type Tree = (File | Folder)[][]
export type SelectedFile =
	| (File & {
			isGithub?: boolean
	  })
	| null

export const treeStore = writable<Tree>([])
export const selectedFile = writable<SelectedFile | null>(null)

export type MoveToDialog = {
	element: HTMLDialogElement | null
	target: Folder | File | null
}
export const moveToDialog = writable<MoveToDialog>({ element: null, target: null })

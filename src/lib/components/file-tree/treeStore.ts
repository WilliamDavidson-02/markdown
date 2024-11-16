import type { fileTable, folderTable } from '$lib/db/schema'
import { writable } from 'svelte/store'
import { renameSchema } from '../../../routes/[docId]/schemas'
import type { SuperValidated } from 'sveltekit-superforms'
import type { z } from 'zod'

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

export type RenameDialog = {
	element: HTMLDialogElement | null
	target: File | Folder | null
	form: SuperValidated<z.infer<typeof renameSchema>> | null
}
export const renameDialog = writable<RenameDialog>({ element: null, target: null, form: null })

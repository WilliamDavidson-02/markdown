import type { EditorView } from '@codemirror/view'
import { writable } from 'svelte/store'

export type EditorStore = EditorView | null
export const editorStore = writable<EditorStore>(null)

export type EditorAutoSave = {
	timer: NodeJS.Timeout | null
	status: 'saved' | 'saving' | 'unsaved' | 'error'
}
export const editorAutoSave = writable<EditorAutoSave>({ timer: null, status: 'saved' })

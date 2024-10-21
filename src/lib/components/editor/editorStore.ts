import type { EditorView } from '@codemirror/view'
import { writable } from 'svelte/store'

export type EditorStore = EditorView | null
export const editorStore = writable<EditorStore>(null)

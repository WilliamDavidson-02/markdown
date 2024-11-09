import type { EditorView, ViewUpdate } from '@codemirror/view'
import { selectedFile } from '$lib/components/file-tree/treeStore'
import { editorSave, type EditorSave } from './editorStore'

export const handleSave = async (doc: string) => {
	let status: 'saved' | 'error' = 'saved'

	selectedFile.subscribe(async (file) => {
		if (!file) return

		try {
			await fetch(`/${file.id}/save`, {
				method: 'PUT',
				body: JSON.stringify({ file: { ...file, doc } })
			})
			status = 'saved'
		} catch {
			status = 'error'
		}
	})

	return status
}

export const handleAutoSave = (state: EditorSave, update: ViewUpdate): EditorSave => {
	if (state.timer) clearTimeout(state.timer)
	let initialFile: string | undefined
	selectedFile.subscribe((file) => {
		if (!file) return
		initialFile = file.doc?.toString()
	})

	if (!initialFile) return { timer: null, status: 'saved' }

	const currentDoc = update.state.doc.toString()

	if (initialFile === currentDoc) return { timer: null, status: 'saved' }

	return {
		timer: setTimeout(async () => {
			editorSave.update((s) => ({ ...s, status: 'saving' }))
			const status = await handleSave(currentDoc)
			editorSave.set({ timer: null, status })
		}, 3000),
		status: state.timer ? 'unsaved' : 'saved'
	}
}

export const handleDocChange = (update: ViewUpdate): EditorSave => {
	let initialFile: string | undefined
	selectedFile.subscribe((file) => {
		if (!file) return
		initialFile = file.doc?.toString()
	})

	if (!initialFile) return { timer: null, status: 'saved' }

	const currentDoc = update.state.doc.toString()

	if (initialFile === currentDoc) return { timer: null, status: 'saved' }

	return {
		timer: null,
		status: 'unsaved'
	}
}

export const handleManualSave = async (view: EditorView) => {
	let currentStatus = ''
	editorSave.subscribe((state) => {
		currentStatus = state.status
	})

	if (['saving', 'saved'].includes(currentStatus)) return

	editorSave.set({ timer: null, status: 'saving' })
	const status = await handleSave(view.state.doc.toString())
	editorSave.set({ timer: null, status })
}

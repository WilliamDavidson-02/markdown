import type { EditorView, ViewUpdate } from '@codemirror/view'
import { selectedFile } from '$lib/components/file-tree/treeStore'
import { editorSave, type EditorSave } from './editorStore'
import { page } from '$app/stores'
import type { SelectedFile } from '$lib/components/file-tree/treeStore'

export const handleSave = async (doc: string, file: SelectedFile) => {
	let status: 'saved' | 'error' = 'saved'

	if (!file) return 'error'

	try {
		await fetch(`/${file.id}/save`, {
			method: 'PUT',
			body: JSON.stringify({ file: { ...file, doc } })
		})
		status = 'saved'
	} catch {
		status = 'error'
	}

	return status
}

export const handleAutoSave = (state: EditorSave, update: ViewUpdate): EditorSave => {
	if (state.timer) clearTimeout(state.timer)
	let initialFile: string | undefined
	let file: SelectedFile | null = null
	selectedFile.subscribe((f) => {
		if (!f) return
		initialFile = f.doc?.toString()
		file = f
	})

	page.subscribe((p) => {
		if (p.params.docId !== file?.id) {
			initialFile = undefined
		}
	})

	const currentDoc = update.state.doc.toString()
	if (!file || initialFile === undefined || initialFile === currentDoc)
		return { timer: null, status: 'saved' }

	return {
		timer: setTimeout(async () => {
			editorSave.update((s) => ({ ...s, status: 'saving' }))
			const status = await handleSave(currentDoc, file)
			selectedFile.update((f) => {
				if (!f) return f
				return { ...f, doc: currentDoc }
			})
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

	const currentDoc = update.state.doc.toString()

	if (initialFile === undefined || initialFile === currentDoc)
		return { timer: null, status: 'saved' }

	return {
		timer: null,
		status: 'unsaved'
	}
}

export const handleManualSave = async (view: EditorView) => {
	let currentStatus = ''
	let file: SelectedFile | null = null
	selectedFile.subscribe((f) => {
		if (!f) return
		file = f
	})
	editorSave.subscribe((state) => {
		currentStatus = state.status
	})

	if (['saving', 'saved'].includes(currentStatus)) return

	editorSave.set({ timer: null, status: 'saving' })
	const status = await handleSave(view.state.doc.toString(), file)
	editorSave.set({ timer: null, status })
}

import { EditorState } from '@codemirror/state'
import {
	EditorView,
	keymap,
	highlightActiveLine,
	highlightSpecialChars,
	drawSelection,
	dropCursor,
	rectangularSelection
} from '@codemirror/view'
import { indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import {
	bracketMatching,
	indentOnInput,
	defaultHighlightStyle,
	syntaxHighlighting
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'

import { completions, resizeTable, handleLinks } from './assistance'
import { customKeymaps, reMappedKeymap } from './commands'
import { theme } from './theme'
import { editorAutoSave, editorStore } from './editorStore'
import { selectedFile } from '$lib/components/file-tree/treeStore'

const autoSave = async (view: EditorView) => {
	let status: 'saved' | 'error' = 'saved'

	selectedFile.subscribe(async (file) => {
		if (!file || file.doc === view.state.doc.toString()) return

		try {
			await fetch(`/${file.id}/save`, {
				method: 'PUT',
				body: JSON.stringify({ file: { ...file, doc: view.state.doc.toString() } })
			})
			status = 'saved'
		} catch {
			status = 'error'
		}
	})

	return status
}

export const state = EditorState.create({
	doc: '',
	extensions: [
		EditorView.lineWrapping,
		EditorState.allowMultipleSelections.of(true),
		EditorView.updateListener.of((update) => {
			if (update.docChanged || update.selectionSet) editorStore.set(update.view)
			if (update.docChanged) {
				editorAutoSave.update((state) => {
					if (state.timer) clearTimeout(state.timer)
					let id: string | undefined = undefined
					selectedFile.subscribe((file) => {
						id = file?.id
					})
					if (!id) return { timer: null, status: 'saved' }

					return {
						timer: setTimeout(async () => {
							editorAutoSave.update((s) => ({ ...s, status: 'saving' }))
							const status = await autoSave(update.view)
							editorAutoSave.set({ timer: null, status })
						}, 3000),
						status: state.timer ? 'unsaved' : 'saved'
					}
				})
			}
		}),
		keymap.of([
			...closeBracketsKeymap,
			...reMappedKeymap,
			...historyKeymap,
			...completionKeymap,
			indentWithTab,
			...customKeymaps
		]),
		theme,
		resizeTable,
		handleLinks,
		autocompletion(),
		history(),
		bracketMatching(),
		closeBrackets(),
		highlightActiveLine(),
		highlightSpecialChars(),
		drawSelection(),
		dropCursor(),
		rectangularSelection(),
		indentOnInput(),
		markdown({
			base: markdownLanguage,
			codeLanguages: languages,
			addKeymap: true
		}),
		markdownLanguage.data.of({
			autocomplete: completions
		}),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true })
	]
})

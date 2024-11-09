import { EditorState } from '@codemirror/state'
import {
	EditorView,
	keymap,
	highlightActiveLine,
	highlightSpecialChars,
	drawSelection,
	dropCursor,
	rectangularSelection,
	type KeyBinding
} from '@codemirror/view'
import { indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import {
	bracketMatching,
	indentOnInput,
	defaultHighlightStyle,
	syntaxHighlighting,
	indentUnit
} from '@codemirror/language'
import {
	closeBrackets,
	closeBracketsKeymap,
	autocompletion,
	completionKeymap
} from '@codemirror/autocomplete'

import { completions, resizeTable, handleLinks } from './assistance'
import { theme, themeHighlightStyle } from './theme'
import { editorSave, editorStore, type EditorSave } from './editorStore'
import { defaultEditorSettings } from '../settings/defaultSettings'
import { handleAutoSave, handleDocChange } from './save'

export const state = (
	editorSettings: typeof defaultEditorSettings = defaultEditorSettings,
	editorKeymaps: KeyBinding[] = []
) => {
	let extensions = [
		EditorState.allowMultipleSelections.of(true),
		EditorView.updateListener.of((update) => {
			if (update.docChanged || update.selectionSet) editorStore.set(update.view)
			if (update.docChanged) {
				if (editorSettings.autoSave) {
					editorSave.update((state) => handleAutoSave(state, update) as EditorSave)
				} else {
					editorSave.update(() => handleDocChange(update))
				}
			}
		}),
		keymap.of([
			...closeBracketsKeymap,
			...editorKeymaps,
			...historyKeymap,
			...completionKeymap,
			indentWithTab
		]),
		theme(editorSettings),
		syntaxHighlighting(themeHighlightStyle),
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
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		indentUnit.of(' '.repeat(editorSettings.tabSize))
	]

	if (editorSettings.wordWrap) extensions.push(EditorView.lineWrapping)

	return EditorState.create({
		doc: '',
		extensions
	})
}

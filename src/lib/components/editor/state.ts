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
import { editorStore } from './editorStore'

export const state = EditorState.create({
	doc: '',
	extensions: [
		EditorView.lineWrapping,
		EditorState.allowMultipleSelections.of(true),
		EditorView.updateListener.of((update) => {
			if (update.docChanged || update.selectionSet) editorStore.set(update.view)
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

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

const initDoc = `## Table section
|First Header|Second Header|
|-----------:|:-----------:|
|1 col 1 row |2 col 1 row  |
|1 col 2 row |2 col 2 row  |
|1 col 3 row |2 col 3 row  |
|1 col 4 row |2 col 4 row  |

this is a test _for the bold and the *italic assistances*.

1. First item
2. Second item
3. Third item
    1. Indented item
    2. Indented item
4. Fourth item

- First item
- Second item
- Third item
    - Indented item
    - Indented item
- Fourth item

## Task section
- [ ] a task list item
- [ ] list "syntax required"
- [ ] normal **formatting kaopw kdpoak wdopkawd**, @mentions, #1234 refs
    - [ ] incomplete
- [x] completed

# Link section
https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.pixelstalk.net%2Fwp-content%2Fuploads%2F2016%2F04%2FDesktop-landscape-wallpaper-HD-1.jpg&f=1&nofb=1&ipt=23e913794b994d1ffd5f1c198007921deb0772625b0390c8b1b7361970036afd&ipo=images

this is not a match but this is a link http://localhost:5173/

http://localhost:5173/
`

export const state = EditorState.create({
	doc: initDoc,
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

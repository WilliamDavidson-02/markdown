<script lang="ts">
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
	import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
	import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
	import { languages } from '@codemirror/language-data'
	import {
		bracketMatching,
		indentOnInput,
		defaultHighlightStyle,
		syntaxHighlighting
	} from '@codemirror/language'
	import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
	import { onMount } from 'svelte'

	import { resizeTable } from '../assistance'
	import { customKeymaps } from '../commands'

	let parent: HTMLDivElement
	const initDoc = `
|First Header|Second Header|
|-----------:|:-----------:|
|1 col 1 row |2 col 1 row  |
|1 col 2 row |2 col 2 row  |
|1 col 2 row |2 col 2 row  |
|1 col 2 row |2 col 2 row  |

this is a test for the bold and the italic assistances.
`

	const theme = EditorView.theme({
		'&': {
			height: '100vh'
		}
	})

	// Replace default keymap Mod-i, so custom Mod-i can be used
	const reMappedKeymap = defaultKeymap.map((keymap: KeyBinding) => {
		if (keymap.key === 'Mod-i') {
			keymap.key = 'Shift-Mod-i'
		}
		return keymap
	})

	let state = EditorState.create({
		doc: initDoc,
		extensions: [
			EditorView.lineWrapping,
			EditorState.allowMultipleSelections.of(true),
			keymap.of([
				...closeBracketsKeymap,
				...reMappedKeymap,
				...historyKeymap,
				indentWithTab,
				...customKeymaps
			]),
			theme,
			resizeTable,
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
			syntaxHighlighting(defaultHighlightStyle, { fallback: true })
		]
	})

	onMount(() => {
		const view = new EditorView({ state, parent })
		view.focus()

		return () => {
			view.destroy()
		}
	})
</script>

<div bind:this={parent} />

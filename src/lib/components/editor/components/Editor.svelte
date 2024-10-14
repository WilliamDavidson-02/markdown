<script lang="ts">
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
	import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
	import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
	import { languages } from '@codemirror/language-data'
	import { bracketMatching, indentOnInput } from '@codemirror/language'
	import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
	import { onMount } from 'svelte'

	let parent: HTMLDivElement

	const theme = EditorView.theme({
		'&': {
			height: '100vh'
		}
	})

	let state = EditorState.create({
		doc: '',
		extensions: [
			EditorView.lineWrapping,
			EditorState.allowMultipleSelections.of(true),
			keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
			theme,
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
			})
		]
	})

	onMount(() => {
		const view = new EditorView({ state, parent })

		return () => {
			view.destroy()
		}
	})
</script>

<div bind:this={parent} />

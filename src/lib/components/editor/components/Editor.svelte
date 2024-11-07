<script lang="ts">
	import { EditorView } from '@codemirror/view'
	import { onMount } from 'svelte'
	import { state } from '../state'
	import { editorStore } from '../editorStore'

	export let editorElement: HTMLDivElement

	onMount(() => {
		const view = new EditorView({ state, parent: editorElement })
		view.focus()
		editorStore.set(view)

		return () => {
			view.destroy()
			editorStore.set(null)
		}
	})
</script>

<div bind:this={editorElement} {...$$restProps} />

<style>
	div {
		max-height: inherit;
		height: inherit;
	}

	div :global(.cm-focused) {
		outline: none !important;
	}
</style>

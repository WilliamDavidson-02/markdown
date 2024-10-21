<script lang="ts">
	import { EditorView } from '@codemirror/view'
	import { onMount } from 'svelte'
	import { state } from '../state'
	import Header from './Header.svelte'
	import { editorStore } from '../editorStore'

	let parent: HTMLDivElement

	onMount(() => {
		const view = new EditorView({ state, parent })
		view.focus()
		editorStore.set(view)

		return () => {
			view.destroy()
			editorStore.set(null)
		}
	})
</script>

<section>
	<Header />
	<div bind:this={parent} />
</section>

<style>
	section {
		flex-grow: 1;
	}

	div {
		height: calc(100vh - var(--header-height, 40px));
	}
</style>

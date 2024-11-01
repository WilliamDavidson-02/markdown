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
		display: grid;
		grid-template-rows: auto 1fr;
		max-height: 100svh;
	}

	div {
		max-height: 100%;
		height: 100%;
		overflow-y: auto;
	}
</style>

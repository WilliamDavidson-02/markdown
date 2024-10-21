<script lang="ts">
	import { EditorView } from '@codemirror/view'
	import { onMount } from 'svelte'
	import { state } from '../state'
	import Header from './Header.svelte'

	let parent: HTMLDivElement

	onMount(() => {
		const view = new EditorView({ state, parent })
		view.focus()

		return () => {
			view.destroy()
		}
	})
</script>

<section>
	<Header />
	<div bind:this={parent} />
</section>

<style>
	div {
		height: calc(100vh - var(--header-height, 40px));
	}
</style>

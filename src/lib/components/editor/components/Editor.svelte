<script lang="ts">
	import { EditorView } from '@codemirror/view'
	import { onMount } from 'svelte'
	import { state } from '../state'

	let parent: HTMLDivElement

	onMount(() => {
		const view = new EditorView({ state, parent })
		view.focus()

		return () => {
			view.destroy()
		}
	})
</script>

<div bind:this={parent} />

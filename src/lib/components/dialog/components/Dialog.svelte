<script lang="ts">
	import { Button } from '$lib/components/button'
	import { X } from 'lucide-svelte'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	export let dialog: HTMLDialogElement

	onMount(() => {
		const closeDialog = (ev: KeyboardEvent | MouseEvent) => {
			if (ev instanceof KeyboardEvent && ev.key === 'Escape') {
				ev.preventDefault()
				dialog.close()
			}
		}
		dialog.addEventListener('click', closeDialog)
		return () => {
			dialog.removeEventListener('click', closeDialog)
		}
	})
</script>

<dialog bind:this={dialog} on:close transition:fade={{ duration: 200 }}>
	<div class="close-header">
		<Button variant="ghost" icon size="sm" on:click={() => dialog.close()}>
			<X size={16} />
		</Button>
	</div>
	<slot />
</dialog>

<style>
	dialog {
		background-color: var(--base);
		color: var(--foreground-dk);
		padding: var(--space-xl);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
		max-width: 500px;
		width: 100%;

		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin: 0;
	}

	dialog::backdrop {
		background-color: color-mix(in srgb, var(--base) 25%, transparent);
	}

	.close-header {
		display: flex;
		justify-content: flex-end;
	}
</style>

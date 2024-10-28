<script lang="ts">
	import { Button } from '$lib/components/button'
	import { X } from 'lucide-svelte'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	export let dialog: HTMLDialogElement
	export let withClose: boolean = true
	let className: string = ''
	export { className as class }

	onMount(() => {
		const closeDialog = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') {
				ev.preventDefault()
				dialog.close()
			}
		}

		window.addEventListener('keydown', closeDialog)
		return () => {
			window.removeEventListener('keydown', closeDialog)
		}
	})
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions svelte-ignore a11y-click-events-have-key-events -->
<dialog
	bind:this={dialog}
	on:close
	transition:fade={{ duration: 200 }}
	class={className}
	on:click={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions svelte-ignore a11y-click-events-have-key-events -->
	<div
		on:click={(ev) => {
			ev.stopPropagation()
		}}
		role="dialog"
	>
		{#if withClose}
			<div class="close-header">
				<Button variant="ghost" type="button" icon size="sm" on:click={() => dialog.close()}>
					<X size={16} />
				</Button>
			</div>
		{/if}
		<slot />
	</div>
</dialog>

<style>
	dialog {
		background-color: var(--base);
		color: var(--foreground-dk);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
		max-width: 500px;
		width: 100%;
		overflow: visible;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin: 0;
		outline: none;
		box-shadow: var(--shadow-overlay);
	}

	dialog > div {
		padding: var(--space-xl);
	}

	dialog::backdrop {
		background-color: color-mix(in srgb, var(--base) 25%, transparent);
	}

	.close-header {
		display: flex;
		justify-content: flex-end;
	}
</style>

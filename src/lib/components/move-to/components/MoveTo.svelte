<script lang="ts">
	import { Command, CommandInput, CommandItem, CommandList } from '$lib/components/command'
	import { Dialog } from '$lib/components/dialog'
	import type { Folder } from '$lib/components/file-tree/treeStore'
	import { moveToDialog } from '$lib/components/file-tree/treeStore'
	import MoveToItem from './MoveToItem.svelte'
	import MoveToRootItem from './MoveToRootItem.svelte'

	export let folders: Folder[]
	export let isGithub = false

	let searchValue = ''
	let dialog: HTMLDialogElement

	$: moveToDialog.update((m) => ({ ...m, element: dialog }))

	const handleClose = () => {
		moveToDialog.update((m) => ({ ...m, target: null }))
		searchValue = ''
	}
</script>

<Dialog bind:dialog on:close={handleClose} withClose={false} class="move-to-dialog">
	<Command class="move-to-command">
		<CommandInput
			bind:value={searchValue}
			autofocus={$moveToDialog?.element?.open}
			placeholder="Search..."
		/>
		<CommandList class="move-to-command-list">
			<ul>
				{#if !isGithub}
					<MoveToRootItem />
				{/if}
				{#each folders as folder}
					{#if folder.id !== $moveToDialog.target?.id}
						<MoveToItem {folder} />
					{/if}
				{/each}
			</ul>
		</CommandList>
	</Command>
</Dialog>

<style>
	:global(.move-to-dialog) {
		max-width: 700px;
		width: 100%;
		max-height: 800px;
		height: 100%;
		padding: var(--space-base);
	}

	:global(.move-to-command) {
		gap: var(--space-base);
		display: grid !important;
		grid-template-rows: auto 1fr;
		height: 100%;
	}

	:global(.move-to-command-list) {
		overflow-y: auto;
		max-height: max-content;
		overscroll-behavior: contain;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>

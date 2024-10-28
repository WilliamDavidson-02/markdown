<script lang="ts">
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Dialog } from '$lib/components/dialog'
	import { isFolder } from '$lib/utilts/tree'
	import { TrashItem, TrashContent, TrashActions } from '..'
	import { trashStore } from '../trashStore'
	import TrashFolder from './TrashFolder.svelte'

	export let trashDialog: HTMLDialogElement
</script>

<Dialog bind:dialog={trashDialog} withClose={false} class="trash-dialog">
	<Command class="trash-command">
		<CommandInput placeholder="Search..." autofocus />
		<CommandList class="trash-command-list">
			<ul class="file-tree">
				{#each $trashStore as item}
					{#if isFolder(item)}
						<TrashFolder folder={item} />
					{:else}
						<CommandItem value={item.name ?? 'Untitled'} id={item.id}>
							<TrashContent>
								<TrashItem item={{ id: item.id, icon: item.icon ?? 'File' }}>
									{item.name}
								</TrashItem>
								<TrashActions {item} />
							</TrashContent>
						</CommandItem>
					{/if}
				{/each}
			</ul>
		</CommandList>
	</Command>
</Dialog>

<style>
	:global(.trash-dialog) {
		max-height: 500px;
		height: 100%;
		max-width: 500px;
		width: 100%;
		padding: var(--space-xl);
	}

	:global(.trash-command) {
		gap: var(--space-base);
		display: grid !important;
		grid-template-rows: auto 1fr;
		height: 100%;
	}

	:global(.trash-command-list) {
		overflow-y: auto;
		max-height: 100%;
		overscroll-behavior: contain;
	}

	.file-tree {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>

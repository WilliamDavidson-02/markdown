<script lang="ts">
	import { Dialog } from '$lib/components/dialog'
	import { renameDialog } from '$lib/components/file-tree/treeStore'
	import { isFolder } from '$lib/utilts/tree'
	import RenameFile from './RenameFile.svelte'
	import RenameFolder from './RenameFolder.svelte'

	let dialog: HTMLDialogElement

	$: renameDialog.update((r) => ({ ...r, element: dialog }))

	const handleClose = () => {
		renameDialog.update((r) => ({ ...r, target: null }))
	}
</script>

<Dialog bind:dialog on:close={handleClose} class="rename-dialog">
	{#if $renameDialog.target}
		{#if isFolder($renameDialog.target)}
			<RenameFolder folder={$renameDialog.target} />
		{:else}
			<RenameFile file={$renameDialog.target} />
		{/if}
	{/if}
</Dialog>

<style>
	:global(.rename-dialog) {
		max-width: 500px;
		width: 100%;
		padding: var(--space-base);
	}
</style>

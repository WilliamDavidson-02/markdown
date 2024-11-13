<script lang="ts">
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Loader2 } from 'lucide-svelte'
	import { invalidateAll } from '$app/navigation'
	import type { Folder } from '$lib/components/file-tree/treeStore'

	export let pullDialog: HTMLDialogElement
	export let rootFolder: Folder
	export let folderIds: string[] = []
	export let fileIds: string[] = []
	export let target: { id: string; path: string }

	let isPulling = false

	const handlePull = async () => {
		try {
			isPulling = true
			await fetch(`/github/git-pull`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					rootFolder: {
						name: rootFolder.name,
						id: rootFolder.id
					},
					target,
					folderIds,
					fileIds
				})
			})

			await invalidateAll()
		} catch (err) {
			console.log(err)
		} finally {
			isPulling = false
			pullDialog.close()
		}
	}
</script>

<Dialog bind:dialog={pullDialog} class="github-pull-dialog">
	<DialogHeader>Pull content?</DialogHeader>
	<div class="pull-dialog-content">Content pulled from Github will overwrite your notes.</div>
	<DialogFooter>
		<Button variant="outline" on:click={() => pullDialog.close()}>Cancel</Button>
		<Button variant="primary" on:click={handlePull} disabled={isPulling}>
			{#if isPulling}
				<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
			{/if}
			Pull
		</Button>
	</DialogFooter>
</Dialog>

<style>
	:global(.github-pull-dialog) {
		max-width: 500px;
		width: 100%;
		padding: var(--space-base);
	}

	.pull-dialog-content {
		margin-top: var(--space-base);
	}
</style>

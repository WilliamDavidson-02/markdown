<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Loader2, Trash2, Undo2 } from 'lucide-svelte'
	import { findFolderById, getNestedIds } from '$lib/utilts/helpers'
	import { isFolder } from '$lib/utilts/tree'
	import type { File, Folder } from '$lib/components/file-tree/treeStore'
	import { invalidateAll } from '$app/navigation'
	import { treeStore } from '$lib/components/file-tree/treeStore'

	export let item: File | Folder // item from trash not file tree

	let isRestoring = false
	let isDeleting = false

	const handleUndo = async (ev: MouseEvent) => {
		ev.preventDefault()
		ev.stopPropagation()
		isRestoring = true
		try {
			const children: string[] | null = isFolder(item) ? getNestedIds([item]) : null

			const res = await fetch(`/${item.id}/restore`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ children })
			})
			if (res.ok) {
				await invalidateAll()
			}
		} catch (error) {
			console.error(error)
		} finally {
			isRestoring = false
		}
	}
	const handleDelete = async (ev: MouseEvent) => {
		ev.preventDefault()
		ev.stopPropagation()

		isDeleting = true
		try {
			const folders = $treeStore.flat().filter((item) => isFolder(item))
			const folder = findFolderById(folders, item.id)

			let children: string[] | null = isFolder(item) ? getNestedIds([item]) : null

			// Check if there is any items left with in the folder in the file tree
			// If there is remove the folder id from the id list so it doesn't get deleted
			if (folder && children) {
				const treeChildren = getNestedIds([folder]).filter((id) => id === item.id)

				if (treeChildren.length > 0) {
					children = children.filter((id) => id !== item.id)
				}
			}

			const res = await fetch(`/${item.id}/delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ children, parentFolderId: folder?.id })
			})
			if (res.ok) {
				await invalidateAll()
			}
		} catch (error) {
			console.error(error)
		} finally {
			isDeleting = false
		}
	}
</script>

<div class="trash-actions">
	<Button
		variant="ghost"
		icon
		size="sm"
		class="trash-action"
		on:click={handleUndo}
		disabled={isRestoring}
	>
		{#if isRestoring}
			<Loader2 size={16} color="var(--foreground-md)" class="animate-spin" />
		{:else}
			<Undo2 size={16} color="var(--foreground-md)" />
		{/if}
	</Button>
	<Button
		variant="ghost"
		icon
		size="sm"
		class="trash-action"
		on:click={handleDelete}
		disabled={isDeleting}
	>
		{#if isDeleting}
			<Loader2 size={16} color="var(--foreground-md)" class="animate-spin" />
		{:else}
			<Trash2 size={16} color="var(--foreground-md)" />
		{/if}
	</Button>
</div>

<style>
	.trash-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding-right: var(--space-sm);
	}

	.trash-actions :global(.trash-action:active) {
		background-color: var(--secondary-dk);
	}

	@media (pointer: fine) {
		.trash-actions :global(.trash-action:hover) {
			background-color: var(--secondary-dk);
		}
	}
</style>

<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Loader2, Trash2, Undo2 } from 'lucide-svelte'
	import { getNestedIds } from '$lib/utilts/helpers'
	import { isFolder } from '$lib/utilts/tree'
	import type { File, Folder } from '$lib/components/file-tree/treeStore'
	import { invalidateAll } from '$app/navigation'

	export let item: File | Folder

	let isRestoring = false

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
	const handleDelete = (ev: MouseEvent) => {
		ev.preventDefault()
		ev.stopPropagation()
		console.log('delete')
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
	<Button variant="ghost" icon size="sm" class="trash-action" on:click={handleDelete}>
		<Trash2 size={16} color="var(--foreground-md)" />
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

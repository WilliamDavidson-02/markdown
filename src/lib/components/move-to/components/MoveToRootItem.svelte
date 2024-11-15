<script lang="ts">
	import { Button } from '$lib/components/button'
	import { moveToDialog, selectedFile } from '$lib/components/file-tree/treeStore'
	import { ChevronRight, FolderRoot, Loader2 } from 'lucide-svelte'
	import type { moveToSchema } from '../../../../routes/[docId]/move-to/schema'
	import type { z } from 'zod'
	import { isFolder } from '$lib/utilts/tree'
	import { invalidateAll } from '$app/navigation'

	let isLoading = false

	const handleSelect = async () => {
		try {
			if (!$moveToDialog.target) return
			isLoading = true

			const targetType = isFolder($moveToDialog.target) ? 'folder' : 'file'

			const body: z.infer<typeof moveToSchema> = {
				target: {
					id: $moveToDialog.target.id,
					type: targetType,
					children: {
						folderIds: [],
						fileIds: []
					}
				},
				movingTo: { id: null, path: null },
				github: false
			}

			const res = await fetch(`/${$selectedFile?.id}/move-to`, {
				method: 'PATCH',
				body: JSON.stringify(body)
			})
			if (res.ok) {
				await invalidateAll()
				$moveToDialog.element?.close()
			}
		} catch (error) {
			console.error(error)
		} finally {
			isLoading = false
		}
	}
</script>

<li>
	<div class="folder-header">
		<div>
			<span class="icon">
				<FolderRoot size={20} />
			</span>
			<p>Move <strong>{$moveToDialog.target?.name}</strong> to root</p>
			<Button
				variant="ghost"
				icon
				on:click={(ev) => {
					ev.stopPropagation()
					handleSelect()
				}}
			>
				{#if isLoading}
					<Loader2 size={18} stroke-width={1.5} class="animate-spin" />
				{:else}
					<ChevronRight size={18} stroke-width={1.5} />
				{/if}
			</Button>
		</div>
	</div>
</li>

<style>
	li {
		display: flex;
		flex-direction: column;
	}

	.folder-header {
		display: flex;
		align-items: center;
		flex-grow: 1;
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		border: 1px solid transparent;
		transition: border 0.2s;
	}

	.folder-header > div {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs);
		width: 100%;
	}

	p {
		color: var(--foreground-dk);
		font-size: 1rem;
		font-weight: 400;
		line-height: 20px;
		margin-right: auto;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon {
		display: grid;
		place-content: center;
		flex-shrink: 0;
		color: var(--foreground-md);
		height: 36px;
		width: 36px;
	}

	:global(.move-to-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.folder-header:active {
		border: 1px solid var(--secondary-dk);
	}

	@media (pointer: fine) {
		.folder-header:hover {
			border: 1px solid var(--secondary-dk);
		}
	}
</style>

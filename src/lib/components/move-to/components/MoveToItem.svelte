<script lang="ts">
	import type { Folder } from '$lib/components/file-tree/treeStore'
	import { ChevronRight, Folder as ClosedFolder, FolderOpen, Loader2 } from 'lucide-svelte'
	import { CommandItem } from '$lib/components/command'
	import { getState } from '$lib/components/command/command'
	import { getNestedIds } from '$lib/utilts/helpers'
	import { slide } from 'svelte/transition'
	import { Button } from '$lib/components/button'
	import { moveToDialog, selectedFile } from '$lib/components/file-tree/treeStore'
	import { invalidateAll } from '$app/navigation'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { githubIds } from '$lib/components/github-tree/githubTreeStore'
	import { formatMoveTo } from '../formatMoveTo'

	export let folder: Folder
	let isOpen = false
	let isLoading = false

	const state = getState()

	const isChildSearchValid = (items: Map<string, number>) => {
		const ids = getNestedIds([folder])
		for (const id of ids) {
			if (items.has(id) && items.get(id) !== 0) return true
		}
		return false
	}

	const handleSelect = async (folder: Folder) => {
		try {
			if (!$moveToDialog.target) return
			isLoading = true

			const body = formatMoveTo(folder, $moveToDialog.target, $githubTree, $githubIds.folderIds)

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

	$: alwaysRender = isChildSearchValid($state.filtered.items)
</script>

<CommandItem value={folder.name ?? 'Untitled'} id={folder.id} {alwaysRender}>
	<li>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="folder-header"
			on:click={() => (isOpen = !isOpen)}
			on:keydown={(e) => e.key === 'Enter' && (isOpen = !isOpen)}
		>
			<div>
				<span class="icon">
					{#if isOpen}
						<FolderOpen size={20} />
					{:else}
						<ClosedFolder size={20} />
					{/if}
				</span>
				<p>{folder.name ?? 'Untitled'}</p>
				<Button
					variant="ghost"
					icon
					on:click={(ev) => {
						ev.stopPropagation()
						handleSelect(folder)
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
		{#key isOpen}
			<ul class="folder-content" transition:slide={{ duration: 200 }} class:open={isOpen}>
				{#each folder.children as child}
					<svelte:self folder={child} />
				{/each}
			</ul>
		{/key}
	</li>
</CommandItem>

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
		cursor: pointer;
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

	.folder-content {
		padding-left: var(--space-sm);
		display: flex;
		flex-direction: column;
		height: 0;
		overflow: hidden;
		transition: height 0.2s;
	}

	.folder-content.open {
		height: auto;
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

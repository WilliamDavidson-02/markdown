<script lang="ts">
	import type { Folder } from '$lib/components/file-tree/treeStore'
	import { Folder as ClosedFolder, FolderOpen } from 'lucide-svelte'
	import { TrashActions, TrashItem, TrashContent } from '..'
	import { CommandItem } from '$lib/components/command'
	import { getState } from '$lib/components/command/command'
	import { getNestedIds } from '$lib/utilts/helpers'
	import { slide } from 'svelte/transition'

	export let folder: Folder
	let isOpen = false

	const state = getState()

	const isChildSearchValid = (items: Map<string, number>) => {
		const ids = getNestedIds([folder])
		for (const id of ids) {
			if (items.has(id) && items.get(id) !== 0) return true
		}
		return false
	}

	$: alwaysRender = isChildSearchValid($state.filtered.items)
</script>

<CommandItem value={folder.name ?? 'Untitled'} id={folder.id} {alwaysRender}>
	<li>
		<TrashContent class="trash-content">
			<button
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
				</div>
				<TrashActions item={folder} />
			</button>
			{#key isOpen}
				<ul class="folder-content" transition:slide={{ duration: 200 }} class:open={isOpen}>
					{#each folder.children as child}
						<svelte:self folder={child} />
					{/each}
					{#each folder.files as file}
						<CommandItem value={file.name ?? 'Untitled'} id={file.id} class="trash-item">
							<TrashItem
								item={{ id: file.id, icon: file.icon ?? 'File', color: file.iconColor ?? '' }}
							>
								{file.name}
							</TrashItem>
							<TrashActions item={file} />
						</CommandItem>
					{/each}
				</ul>
			{/key}
		</TrashContent>
	</li>
</CommandItem>

<style>
	li {
		display: flex;
		flex-direction: column;
	}

	li > :global(.trash-content) {
		display: grid;
		grid-template-rows: auto 1fr;
		justify-content: unset;
	}

	.folder-header {
		all: unset;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		cursor: pointer;
		height: 36px;
	}

	.folder-header > div {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding-left: var(--space-sm);
	}

	p {
		color: var(--foreground-dk);
		font-size: 1rem;
		font-weight: 400;
		line-height: 20px;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon {
		display: grid;
		place-content: center;
		flex-shrink: 0;
		color: var(--foreground-md);
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

	:global(.trash-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>

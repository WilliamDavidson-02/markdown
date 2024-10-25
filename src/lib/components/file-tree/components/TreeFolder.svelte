<script lang="ts">
	import { Folder as ClosedFolder, FolderOpen } from 'lucide-svelte'
	import { slide } from 'svelte/transition'
	import type { Folder } from '../treeStore'
	import TreeFile from './TreeFile.svelte'

	export let folder: Folder
	let isOpen = false
</script>

<li>
	<button class="folder-header" on:click={() => (isOpen = !isOpen)}>
		<span class="icon">
			{#if isOpen}
				<FolderOpen size={20} />
			{:else}
				<ClosedFolder size={20} />
			{/if}
		</span>
		<p>{folder.name ?? 'Untitled'}</p>
	</button>
	{#if isOpen}
		<ul transition:slide={{ duration: 200 }} class="folder-content">
			{#each folder.children as child}
				<svelte:self folder={child} />
			{/each}
			{#each folder.files as file}
				<TreeFile name={file.name ?? 'Untitled'} icon={file.icon} id={file.id} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	.folder-header {
		all: unset;
		display: flex;
		align-items: center;
		background-color: var(--base);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		cursor: pointer;
		height: 36px;
		padding-right: var(--space-sm);
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
		height: 36px;
		width: 36px;
		flex-shrink: 0;
		color: var(--foreground-md);
	}

	.folder-header:active {
		background-color: var(--secondary);
	}

	.folder-content {
		padding-left: var(--space-sm);
		display: flex;
		flex-direction: column;
	}

	@media (pointer: fine) {
		.folder-header:hover {
			background-color: var(--secondary);
		}
	}
</style>

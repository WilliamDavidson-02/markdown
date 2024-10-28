<script lang="ts">
	import {
		Folder as ClosedFolder,
		FolderOpen,
		Ellipsis,
		Loader2,
		Trash2,
		CornerUpRight
	} from 'lucide-svelte'
	import { slide } from 'svelte/transition'
	import { type Folder } from '../treeStore'
	import TreeFile from './TreeFile.svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'

	export let folder: Folder
	let isOpen = false
	let showEllipsis = false
	let isMovingToTrash = false
</script>

<li>
	<button
		class="folder-header"
		on:click={() => (isOpen = !isOpen)}
		on:mouseover={() => (showEllipsis = true)}
		on:mouseleave={() => (showEllipsis = false)}
		on:focus={() => (showEllipsis = true)}
		on:blur={() => (showEllipsis = false)}
	>
		<span class="icon">
			{#if isOpen}
				<FolderOpen size={20} />
			{:else}
				<ClosedFolder size={20} />
			{/if}
		</span>
		<p>{folder.name ?? 'Untitled'}</p>
		<Popover>
			<PopoverTrigger>
				<div class="ellipsis" data-show={showEllipsis}>
					<Ellipsis size={18} />
				</div>
			</PopoverTrigger>
			<PopoverContent>
				<Dropdown>
					<DropdownGroup>
						<DropdownItem>
							<div class="dropdown-item">
								<CornerUpRight size={16} stroke-width={1.5} />
								<span>Move to</span>
							</div>
						</DropdownItem>
						<DropdownItem>
							<div class="dropdown-item">
								<Trash2 size={16} stroke-width={1.5} />
								<span>Move to Trash</span>
							</div>
							{#if isMovingToTrash}
								<Loader2 class="animate-spin" size={14} />
							{/if}
						</DropdownItem>
					</DropdownGroup>
				</Dropdown>
			</PopoverContent>
		</Popover>
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
	li {
		display: flex;
		flex-direction: column;
	}

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
		width: 100%;
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

	.ellipsis {
		all: unset;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--foreground-md);
		padding-left: var(--space-sm);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.ellipsis[data-show='true'] {
		opacity: 1;
	}

	:global(.ellipsis-menu) {
		background-color: var(--secondary);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	@media (pointer: fine) {
		.folder-header:hover {
			background-color: var(--secondary);
		}
	}
</style>

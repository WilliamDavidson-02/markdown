<script lang="ts">
	import { type ComponentType } from 'svelte'
	import { fileIcons, type FileIcon } from '$lib/fileIcons'
	import { selectedFile } from '../treeStore'
	import { Ellipsis, Loader2, Trash2, CornerUpRight } from 'lucide-svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { invalidateAll } from '$app/navigation'

	export let name: string
	export let id: string
	export let icon: FileIcon['name'] | null = 'File'
	export let iconColor: string = 'var(--interactive-active)'

	let showEllipsis = false
	let isMovingToTrash = false
	let isOpen = false

	const moveToTrash = async () => {
		try {
			isMovingToTrash = true
			const res = await fetch(`/${id}/move-to-trash`, {
				method: 'POST',
				body: JSON.stringify({ fileIds: [id] })
			})

			if (res.ok) {
				isOpen = false
				await invalidateAll()
			}
		} catch (error) {
			console.log(error)
		} finally {
			isMovingToTrash = false
		}
	}

	$: iconName = fileIcons.find((i) => i.name === icon)?.icon as ComponentType
</script>

<li
	class="file"
	data-selected={$selectedFile?.id === id}
	on:mouseover={() => (showEllipsis = true)}
	on:mouseleave={() => (showEllipsis = false)}
	on:focus={() => (showEllipsis = true)}
	on:blur={() => (showEllipsis = false)}
>
	<a href={`/${id}`}>
		<span class="icon">
			<svelte:component this={iconName} color={iconColor} size={20} />
		</span>
		<p>{name}</p>
	</a>
	<Popover bind:isOpen>
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
					<DropdownItem on:click={moveToTrash} on:keydown={moveToTrash}>
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
</li>

<style>
	.file {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--base);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		cursor: pointer;
		height: 36px;
		padding-right: var(--space-sm);
	}

	.file > a {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.file[data-selected='true'],
	.file[data-selected='true']:hover {
		background-color: var(--secondary-dk);
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
	}

	.file:active {
		background-color: var(--secondary);
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
		.file:hover {
			background-color: var(--secondary);
		}
	}
</style>

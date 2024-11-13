<script lang="ts">
	import '../styles/folder.css'

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
	import { getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'
	import { invalidateAll } from '$app/navigation'
	import { selectedFile, moveToDialog } from '../treeStore'

	export let folder: Folder
	let isOpen = false
	let showEllipsis = false
	let isMovingToTrash = false
	let isMenuOpen = false

	const moveToTrash = async () => {
		try {
			const folderIds = getNestedFolderIds([folder])
			const fileIds = getNestedFileIds([folder])

			isMovingToTrash = true
			const res = await fetch(`/${$selectedFile?.id}/move-to-trash`, {
				method: 'POST',
				body: JSON.stringify({ folderIds, fileIds })
			})

			if (res.ok) {
				isMenuOpen = false
				await invalidateAll()
			}
		} catch (error) {
			console.log(error)
		} finally {
			isMovingToTrash = false
		}
	}

	const handleMoveTo = () => {
		if (!$moveToDialog?.element) return
		moveToDialog.update((m) => ({ ...m, target: folder }))
		$moveToDialog.element.showModal()
		isMenuOpen = false
	}
</script>

<li class="tree-folder-item">
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
		<p class="folder-name">{folder.name ?? 'Untitled'}</p>
		<Popover bind:isOpen={isMenuOpen}>
			<PopoverTrigger>
				<div class="ellipsis" data-show={showEllipsis}>
					<Ellipsis size={18} />
				</div>
			</PopoverTrigger>
			<PopoverContent>
				<Dropdown>
					<DropdownGroup>
						<DropdownItem on:click={handleMoveTo} on:keydown={handleMoveTo}>
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
	</button>
	{#if isOpen}
		<ul transition:slide={{ duration: 200 }} class="folder-content">
			{#each folder.children as child}
				<svelte:self folder={child} />
			{/each}
			{#each folder.files as file}
				<TreeFile {file} />
			{/each}
		</ul>
	{/if}
</li>

<script lang="ts">
	import '../../file-tree/styles/file.css'

	import { type ComponentType } from 'svelte'
	import { fileIcons, type FileIcon } from '$lib/fileIcons'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import {
		Ellipsis,
		Loader2,
		Trash2,
		CornerUpRight,
		ArrowDownToLine,
		ArrowUpToLine
	} from 'lucide-svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { invalidateAll } from '$app/navigation'
	import { Divider } from '$lib/components/divider'
	import { isFolder } from '$lib/utilts/tree'
	import PullDialog from '$lib/components/editor/components/PullDialog.svelte'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { getFoldersToFilePos, getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'

	export let name: string
	export let id: string
	export let icon: FileIcon['name'] | null = 'File'
	export let iconColor: string = 'var(--interactive-active)'

	let showEllipsis = false
	let isMovingToTrash = false
	let isOpen = false
	let pullDialog: HTMLDialogElement

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

	const openPullDialog = () => {
		pullDialog.showModal()
		isOpen = false
	}

	$: iconName = fileIcons.find((i) => i.name === icon)?.icon as ComponentType

	$: folders = $githubTree.flat().filter((f) => isFolder(f))
	$: rootFolder = getFoldersToFilePos(folders, $selectedFile?.id ?? '')[0]
	$: folderIds = rootFolder ? getNestedFolderIds([rootFolder]) : []
	$: fileIds = rootFolder ? getNestedFileIds([rootFolder]) : []
</script>

<PullDialog bind:pullDialog {rootFolder} {fileIds} {folderIds} />

<li
	class="tree-file-item"
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
				<Divider />
				<DropdownGroup>
					<DropdownItem on:click={openPullDialog} on:keydown={openPullDialog}>
						<div class="dropdown-item">
							<ArrowDownToLine size={16} stroke-width={1.5} />
							<span>Pull</span>
						</div>
					</DropdownItem>
					<DropdownItem>
						<div class="dropdown-item">
							<ArrowUpToLine size={16} stroke-width={1.5} />
							<span>Push</span>
						</div>
					</DropdownItem>
				</DropdownGroup>
			</Dropdown>
		</PopoverContent>
	</Popover>
</li>

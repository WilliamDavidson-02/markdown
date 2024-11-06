<script lang="ts">
	import '../../file-tree/styles/folder.css'

	import {
		Folder as ClosedFolder,
		FolderOpen,
		Ellipsis,
		Loader2,
		Trash2,
		CornerUpRight,
		ArrowDownToLine,
		ArrowUpToLine
	} from 'lucide-svelte'
	import { slide } from 'svelte/transition'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { getFoldersToFolderPos, getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'
	import { invalidateAll } from '$app/navigation'
	import { type Folder, selectedFile } from '$lib/components/file-tree/treeStore'
	import GithubTreeFile from './GithubTreeFile.svelte'
	import { Divider } from '$lib/components/divider'
	import { isFolder } from '$lib/utilts/tree'
	import PullDialog from '$lib/components/editor/components/PullDialog.svelte'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { GitPushForm } from '$lib/components/git-push-form'

	export let folder: Folder

	let isOpen = false
	let showEllipsis = false
	let isMovingToTrash = false
	let isMenuOpen = false
	let pullDialog: HTMLDialogElement
	let showGitPushForm = false

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

	const openPullDialog = () => {
		pullDialog.showModal()
		isMenuOpen = false
	}

	const openGitPushForm = () => {
		showGitPushForm = true
		isMenuOpen = false
	}

	$: folders = $githubTree.flat().filter((f) => isFolder(f))
	$: rootFolder = getFoldersToFolderPos(folders, folder.id)[0]
	$: folderIds = rootFolder ? getNestedFolderIds([rootFolder]) : []
	$: fileIds = rootFolder ? getNestedFileIds([rootFolder]) : []

	$: childFolderIds = getNestedFolderIds([folder])
	$: childFileIds = getNestedFileIds([folder])
</script>

<PullDialog bind:pullDialog {rootFolder} {fileIds} {folderIds} />
<GitPushForm
	bind:showGitPushForm
	{rootFolder}
	selectedItem={{
		id: folder.id,
		name: folder.name ?? '',
		type: 'folder',
		childIds: [...childFolderIds, ...childFileIds]
	}}
/>

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
						<DropdownItem on:click={openGitPushForm} on:keydown={openGitPushForm}>
							<div class="dropdown-item">
								<ArrowUpToLine size={16} stroke-width={1.5} />
								<span>Push</span>
							</div>
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
				<GithubTreeFile name={file.name ?? 'Untitled'} icon={file.icon} id={file.id} />
			{/each}
		</ul>
	{/if}
</li>

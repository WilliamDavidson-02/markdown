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
	import { goto, invalidateAll } from '$app/navigation'
	import { Divider } from '$lib/components/divider'
	import { isFolder } from '$lib/utilts/tree'
	import PullDialog from '$lib/components/editor/components/PullDialog.svelte'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { getFoldersToFilePos, getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'
	import { GitPushForm } from '$lib/components/git-push-form'
	import { handleSave } from '$lib/components/editor/save'
	import { editorSave } from '$lib/components/editor/editorStore'
	import { editorStore } from '$lib/components/editor/editorStore'

	export let name: string
	export let id: string
	export let icon: FileIcon['name'] | null = 'File'
	export let iconColor: string = 'var(--interactive-active)'

	let showEllipsis = false
	let isMovingToTrash = false
	let isOpen = false
	let pullDialog: HTMLDialogElement
	let showGitPushForm = false
	let isLoading = false

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

	const openGitPushForm = () => {
		showGitPushForm = true
		isOpen = false
	}

	const handleFileSelection = async () => {
		isLoading = true
		if ($editorSave.status === 'unsaved' && $editorStore) {
			await handleSave($editorStore.state.doc.toString(), $selectedFile)
		}

		editorSave.update((s) => {
			if (s.timer) clearTimeout(s.timer)
			return { ...s, timer: null, status: 'saved' }
		})

		selectedFile.set(null)

		await goto(`/${id}`)
		isLoading = false
	}

	$: iconName = fileIcons.find((i) => i.name === icon)?.icon as ComponentType

	$: folders = getFoldersToFilePos(
		$githubTree.flat().filter((f) => isFolder(f)),
		id
	)
	$: rootFolder = folders[0]
	$: folderIds = folders.map((f) => f.id)
	$: target = {
		id,
		path:
			folders.length > 1
				? folders
						.slice(1)
						.map((f) => f.name)
						.join('/') + `/${name}`
				: name
	}
</script>

<PullDialog bind:pullDialog {rootFolder} fileIds={[id]} {folderIds} {target} />
<GitPushForm bind:showGitPushForm {rootFolder} selectedItem={{ id, name, type: 'file' }} />

<li
	class="tree-file-item"
	data-selected={$selectedFile?.id === id}
	on:mouseover={() => (showEllipsis = true)}
	on:mouseleave={() => (showEllipsis = false)}
	on:focus={() => (showEllipsis = true)}
	on:blur={() => (showEllipsis = false)}
>
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-interactive-supports-focus -->
	<div class="file-link" role="link" on:click={handleFileSelection}>
		<span class="icon">
			{#if isLoading}
				<Loader2 class="animate-spin" size={20} stroke-width={1.5} color="var(--foreground-md)" />
			{:else}
				<svelte:component this={iconName} color={iconColor} size={20} />
			{/if}
		</span>
		<p>{name}</p>
	</div>
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
</li>

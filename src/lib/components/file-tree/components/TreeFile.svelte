<script lang="ts">
	import '../styles/file.css'

	import { type ComponentType } from 'svelte'
	import { fileIcons, iconColors } from '$lib/fileIcons'
	import { selectedFile, moveToDialog, type File } from '../treeStore'
	import { Ellipsis, Loader2, Trash2, CornerUpRight } from 'lucide-svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { goto, invalidateAll } from '$app/navigation'
	import { editorSave } from '$lib/components/editor/editorStore'
	import { handleSave } from '$lib/components/editor/save'
	import { editorStore } from '$lib/components/editor/editorStore'

	export let file: File

	let showEllipsis = false
	let isMovingToTrash = false
	let isOpen = false
	let isLoading = false

	const moveToTrash = async () => {
		try {
			isMovingToTrash = true
			const res = await fetch(`/${file.id}/move-to-trash`, {
				method: 'POST',
				body: JSON.stringify({ fileIds: [file.id] })
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

		await goto(`/${file.id}`)
		isLoading = false
	}

	const handleMoveTo = () => {
		if (!$moveToDialog?.element) return
		moveToDialog.update((m) => ({ ...m, target: file }))
		$moveToDialog.element.showModal()
		isOpen = false
	}

	$: iconName = fileIcons.find((i) => i.name === file.icon)?.icon as ComponentType
	$: color = iconColors.find((c) => c.color === file.iconColor)?.color ?? iconColors[0].color
</script>

<li
	class="tree-file-item"
	data-selected={$selectedFile?.id === file.id}
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
				<svelte:component this={iconName} {color} size={20} />
			{/if}
		</span>
		<p>{file.name}</p>
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
</li>

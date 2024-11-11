<script lang="ts">
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import {
		Ellipsis,
		CornerUpRight,
		Trash2,
		Loader2,
		Columns2,
		Eye,
		PanelsTopLeft,
		Check,
		Save
	} from 'lucide-svelte'
	import { Divider } from '$lib/components/divider'
	import { editorSave, editorStore } from '../editorStore'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { getCharacterCount, getWordCount } from '$lib/utilts/helpers'
	import { formatDateWithTime } from '$lib/utilts/date'
	import { invalidateAll } from '$app/navigation'
	import {
		getWorkspaceContext,
		WORKSPACE_CONTEXT_NAME,
		type WorkspaceView
	} from '$lib/components/workspace'
	import { getSettings } from '$lib/components/settings/settingsContext'
	import { handleManualSave } from '../save'
	import { onMount } from 'svelte'

	$: doc = $editorStore?.state.doc.toString()
	$: lastEdited = $selectedFile?.updatedAt

	let isMovingToTrash = false
	let isSaving = false
	let isOpen = false
	const workspace = getWorkspaceContext()
	const settings = getSettings()

	const moveToTrash = async () => {
		try {
			isMovingToTrash = true
			const res = await fetch(`/${$selectedFile?.id}/move-to-trash`, {
				method: 'POST',
				body: JSON.stringify({ fileIds: [$selectedFile?.id] })
			})

			if (res.ok) {
				await invalidateAll()
			}
		} catch (error) {
			console.log(error)
		} finally {
			isMovingToTrash = false
			isOpen = false
		}
	}

	const setView = (view: WorkspaceView) => {
		workspace.set({ view })
		window.localStorage.setItem(WORKSPACE_CONTEXT_NAME, JSON.stringify({ view }))
		isOpen = false
	}

	const saveDoc = async () => {
		if (!$editorStore) return
		isSaving = true
		await handleManualSave($editorStore)
		isSaving = false

		selectedFile.update((f) => {
			if (!f) return f
			return { ...f, doc: $editorStore.state.doc.toString() }
		})
	}

	onMount(() => {
		const saveOnKey = (ev: KeyboardEvent) => {
			if (ev.key === 's' && ev.metaKey) {
				ev.preventDefault()
				saveDoc()
			}
		}

		if (!$settings?.editorSettings.autoSave) {
			window.addEventListener('keydown', saveOnKey)
		}

		return () => {
			if (!$settings?.editorSettings.autoSave) {
				window.removeEventListener('keydown', saveOnKey)
			}
		}
	})
</script>

<Popover bind:isOpen>
	<PopoverTrigger>
		<Ellipsis size={20} stroke-width={1.5} />
	</PopoverTrigger>
	<PopoverContent>
		<Dropdown>
			{#if !$settings?.editorSettings.autoSave}
				<DropdownGroup>
					<DropdownItem
						on:click={saveDoc}
						on:keydown={saveDoc}
						disabled={isSaving || $editorSave.status === 'saved'}
					>
						<div class="dropdown-item">
							<Save size={16} stroke-width={1.5} />
							<span>Save</span>
						</div>
						{#if isSaving}
							<Loader2 class="animate-spin" size={14} color="var(--foreground-dk)" />
						{/if}
					</DropdownItem>
				</DropdownGroup>
				<Divider />
			{/if}
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
				<DropdownItem on:click={() => setView('editor')} on:keydown={() => setView('editor')}>
					<div class="dropdown-item">
						<PanelsTopLeft size={16} stroke-width={1.5} />
						<span>Editor view</span>
					</div>
					{#if $workspace.view === 'editor'}
						<Check size={16} stroke-width={1.5} />
					{/if}
				</DropdownItem>
				<DropdownItem on:click={() => setView('split')} on:keydown={() => setView('split')}>
					<div class="dropdown-item">
						<Columns2 size={16} stroke-width={1.5} />
						<span>Split view</span>
					</div>
					{#if $workspace.view === 'split'}
						<Check size={16} stroke-width={1.5} />
					{/if}
				</DropdownItem>
				<DropdownItem on:click={() => setView('preview')} on:keydown={() => setView('preview')}>
					<div class="dropdown-item">
						<Eye size={16} stroke-width={1.5} />
						<span>Preview</span>
					</div>
					{#if $workspace.view === 'preview'}
						<Check size={16} stroke-width={1.5} />
					{/if}
				</DropdownItem>
			</DropdownGroup>
			{#if $selectedFile}
				<Divider />
				<DropdownGroup>
					<div class="doc-info">
						<p>Character count: {getCharacterCount(doc ?? '')}</p>
						<p>Word count: {getWordCount(doc ?? '')}</p>
						{#if lastEdited}
							<p>Last edited: {formatDateWithTime(lastEdited)}</p>
						{/if}
					</div>
				</DropdownGroup>
			{/if}
		</Dropdown>
	</PopoverContent>
</Popover>

<style>
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.doc-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-md);
		color: var(--foreground-md);
		font-size: 0.75rem;
		line-height: 1rem;
		font-weight: 400;
	}
</style>

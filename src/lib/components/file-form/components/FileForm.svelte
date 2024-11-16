<script lang="ts">
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Loader2, Folder as FolderIcon, Check } from 'lucide-svelte'
	import { iconColors } from '$lib/fileIcons'
	import { Label } from '$lib/components/label'
	import { superForm } from 'sveltekit-superforms'
	import type { PageData } from '../../../../routes/[docId]/$types'
	import { goto, invalidateAll } from '$app/navigation'
	import { treeStore, type Tree } from '$lib/components/file-tree/treeStore'
	import { isFolder } from '$lib/utilts/tree'
	import { getAllFolders } from '$lib/utilts/helpers'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import FileNameField from './FileNameField.svelte'

	export let fileDialog: HTMLDialogElement
	export let form: PageData['fileForm']
	export let isGithubTreeShown: boolean

	let isIconPopoverOpen = false
	let isFolderPopoverOpen = false

	const {
		form: fileForm,
		submitting,
		errors,
		enhance
	} = superForm(form, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				fileDialog.close()
				await goto(`/${result.data?.id}`)
				await invalidateAll()
			}
		},
		onSubmit: ({ cancel }) => {
			if (isGithubTreeShown && !$fileForm.folderId) {
				cancel()
				return
			}

			fileForm.update(
				(form) => ({
					...form,
					name: form.name.replace(/[\s\/]/g, ''),
					github: isGithubTreeShown
				}),
				{
					taint: 'untaint-all'
				}
			)
		},
		dataType: 'json'
	})

	const handleFolderSelect = (folderId: string) => {
		fileForm.update((form) => ({ ...form, folderId }), { taint: 'untaint-all' })
		isFolderPopoverOpen = false
	}

	const resetForm = () => {
		fileForm.set({
			icon: 'File',
			name: '',
			iconColor: iconColors[0].color,
			folderId: undefined
		})
		isFolderPopoverOpen = false
		isIconPopoverOpen = false
	}

	const getFolders = (tree: Tree) => {
		const rootFolders = tree.flat().filter((item) => isFolder(item))
		const folders = getAllFolders(rootFolders)
		return folders.map((folder) => ({
			id: folder.id,
			name: folder.name
		}))
	}

	$: folders = getFolders(isGithubTreeShown ? $githubTree : $treeStore)
</script>

<Dialog bind:dialog={fileDialog} on:close={resetForm} class="file-form-dialog">
	<form method="POST" action="?/file" use:enhance>
		<DialogHeader>Create new file</DialogHeader>
		<div class="fields-container">
			<FileNameField {fileForm} autoFocus={fileDialog?.open} {errors} />
			<div class="form-field">
				<Label as="span" role="label">Folder</Label>
				<Popover bind:isOpen={isFolderPopoverOpen}>
					<PopoverTrigger>
						<Button variant="outline" type="button" class="folder-trigger">
							<FolderIcon size={16} />
							<p>
								{$fileForm.folderId
									? folders.find((folder) => folder.id === $fileForm.folderId)?.name
									: 'Selected a folder'}
							</p>
						</Button>
					</PopoverTrigger>
					<PopoverContent closeOnScroll={false}>
						<Command class="command folder-command" label="Search for a folder">
							<CommandInput placeholder="Search..." autofocus={isFolderPopoverOpen} />
							<CommandList class="command-list">
								{#each folders as folder}
									<CommandItem
										class="command-item folder"
										value={folder.name ?? 'Untitled'}
										onSelect={() => handleFolderSelect(folder.id)}
										title={folder.name}
										data-is-selected={$fileForm.folderId === folder.id}
									>
										{folder.name}
										{#if $fileForm.folderId === folder.id}
											<Check size={16} />
										{/if}
									</CommandItem>
								{/each}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
		</div>
		<DialogFooter>
			<Button
				variant="outline"
				type="button"
				disabled={$submitting}
				on:click={() => fileDialog.close()}>Cancel</Button
			>
			<Button type="submit" disabled={$submitting || (isGithubTreeShown && !$fileForm.folderId)}>
				{#if $submitting}
					<Loader2 class="animate-spin" size={20} />
				{/if}
				Create
			</Button>
		</DialogFooter>
	</form>
</Dialog>

<style>
	.fields-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		margin-top: var(--space-base);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	:global(.file-form-dialog) {
		max-width: 500px;
		width: 100%;
		padding: var(--space-xl);
	}

	:global(.command-list) {
		max-height: 300px;
		min-width: 300px;
		overflow-y: auto;
		padding: 0 var(--space-sm) var(--space-sm) var(--space-sm);
	}

	:global(.command) {
		background-color: var(--secondary);
		padding: var(--space-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}

	:global(.folder-trigger) {
		width: 100%;
		justify-content: flex-start !important;
	}

	:global(.folder-trigger p) {
		width: 100%;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.command-item) {
		cursor: pointer;
		transition: background-color 0.2s;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
	}

	:global(.folder) {
		justify-content: space-between;
		padding: var(--space-xs);
		font-size: 0.875rem;
		font-weight: 500;
	}

	:global(.folder-command) {
		width: 100%;
	}

	:global(.command-item:hover:not(:disabled):not([data-is-selected='true'])),
	:global(.command-item[data-selected='true']:not(:disabled):not([data-is-selected='true'])) {
		background-color: var(--secondary-dk);
	}

	:global(.command-item[data-is-selected='true']) {
		background-color: var(--interactive-active);
	}
</style>

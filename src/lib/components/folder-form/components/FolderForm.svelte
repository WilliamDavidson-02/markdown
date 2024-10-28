<script lang="ts">
	import { Dialog, DialogHeader, DialogFooter } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { Loader2, Folder, Check } from 'lucide-svelte'
	import { superForm } from 'sveltekit-superforms'
	import type { PageData } from '../../../../routes/[docId]/$types'
	import { invalidateAll } from '$app/navigation'
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { treeStore, type Tree } from '$lib/components/file-tree/treeStore'
	import { isFolder } from '$lib/utilts/tree'
	import { getAllFolders } from '$lib/utilts/helpers'

	export let folderDialog: HTMLDialogElement
	export let form: PageData['folderForm']
	let isFolderPopoverOpen = false

	const {
		form: folderForm,
		submitting,
		errors,
		enhance
	} = superForm(form, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				folderDialog.close()
				await invalidateAll()
			}
		}
	})

	const handleFolderSelect = (folderId: string) => {
		folderForm.update((form) => ({ ...form, parentId: folderId }), { taint: 'untaint-all' })
		isFolderPopoverOpen = false
	}

	const resetForm = () => {
		folderForm.set({ name: '', parentId: undefined })
		isFolderPopoverOpen = false
	}

	const getFolders = (tree: Tree) => {
		const rootFolders = tree.flat().filter((item) => isFolder(item))
		const folders = getAllFolders(rootFolders)
		return folders.map((folder) => ({
			id: folder.id,
			name: folder.name
		}))
	}

	$: folders = getFolders($treeStore)
</script>

<Dialog bind:dialog={folderDialog} on:close={resetForm} class="folder-form-dialog">
	<form method="POST" action="?/folder" use:enhance>
		<input type="hidden" name="parentId" bind:value={$folderForm.parentId} />
		<DialogHeader>Create new folder</DialogHeader>
		<div class="fields-container">
			<div class="form-field">
				<Label for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					bind:value={$folderForm.name}
					placeholder="Enter a folder name"
					autofocus={folderDialog?.open}
				/>
				<ErrorMessage error={$errors.name} />
			</div>
			<div class="form-field">
				<Label as="span" role="label">Folder</Label>
				<Popover bind:isOpen={isFolderPopoverOpen}>
					<PopoverTrigger>
						<Button variant="outline" type="button" class="folder-trigger">
							<Folder size={16} />
							<p>
								{$folderForm.parentId
									? folders.find((folder) => folder.id === $folderForm.parentId)?.name
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
										data-is-selected={$folderForm.parentId === folder.id}
									>
										{folder.name}
										{#if $folderForm.parentId === folder.id}
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
			<Button variant="outline" on:click={() => folderDialog.close()}>Cancel</Button>
			<Button type="submit">
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

	:global(.folder-form-dialog) {
		max-width: 500px;
		width: 100%;
		padding: var(--space-xl);
	}
</style>

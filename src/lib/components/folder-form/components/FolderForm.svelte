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
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'

	export let folderDialog: HTMLDialogElement
	export let form: PageData['folderForm']
	export let isGithubTreeShown: boolean
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
		},
		onSubmit: ({ cancel }) => {
			if (isGithubTreeShown && !$folderForm.parentId) {
				cancel()
				return
			}

			folderForm.update(
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

	const handleFolderNameChange = (ev: Event) => {
		const target = ev.target as HTMLInputElement
		const name = target.value.replace(/[\s\/]/g, '')
		folderForm.update((form) => ({ ...form, name }), { taint: 'untaint-all' })
	}

	$: folders = getFolders(isGithubTreeShown ? $githubTree : $treeStore)
</script>

<Dialog bind:dialog={folderDialog} on:close={resetForm} class="folder-form-dialog">
	<form method="POST" action="?/folder" use:enhance>
		<DialogHeader>Create new folder</DialogHeader>
		<div class="fields-container">
			<div class="form-field">
				<Label for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					value={$folderForm.name}
					placeholder="Enter a folder name"
					autofocus={folderDialog?.open}
					on:input={handleFolderNameChange}
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
			<Button
				variant="outline"
				type="button"
				disabled={$submitting}
				on:click={() => folderDialog.close()}>Cancel</Button
			>
			<Button type="submit" disabled={$submitting || (isGithubTreeShown && !$folderForm.parentId)}>
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

<script lang="ts">
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Loader2, Folder as FolderIcon, Check } from 'lucide-svelte'
	import { fileIcons, iconColors } from '$lib/fileIcons'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { superForm } from 'sveltekit-superforms'
	import type { PageData } from '../../../../routes/[docId]/$types'
	import { goto, invalidateAll } from '$app/navigation'
	import { treeStore, type Tree } from '$lib/components/file-tree/treeStore'
	import { isFolder } from '$lib/utilts/tree'
	import { getAllFolders } from '$lib/utilts/helpers'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'

	export let fileDialog: HTMLDialogElement
	export let form: PageData['fileForm']
	export let isGithubTreeShown: boolean

	let isIconPopoverOpen = false
	let isFolderPopoverOpen = false
	let isIconColorPopoverOpen = false
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

	const handleIconSelect = (iconName: string) => {
		fileForm.update((form) => ({ ...form, icon: iconName }), { taint: 'untaint-all' })
		isIconPopoverOpen = false
	}

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

	const selectIconColor = (color: string) => {
		fileForm.update((form) => ({ ...form, iconColor: color }), { taint: 'untaint-all' })
		isIconColorPopoverOpen = false
	}

	const handleFileNameChange = (ev: Event) => {
		const target = ev.target as HTMLInputElement
		const name = target.value.replace(/[\s\/]/g, '')
		fileForm.update((form) => ({ ...form, name }), { taint: 'untaint-all' })
	}

	$: folders = getFolders(isGithubTreeShown ? $githubTree : $treeStore)
</script>

<Dialog bind:dialog={fileDialog} on:close={resetForm} class="file-form-dialog">
	<form method="POST" action="?/file" use:enhance>
		<DialogHeader>Create new file</DialogHeader>
		<div class="fields-container">
			<div class="form-field file-icon">
				<Popover bind:isOpen={isIconPopoverOpen} class="file-icon-popover">
					<PopoverTrigger>
						<Button variant="outline" type="button" icon>
							<svelte:component
								this={fileIcons.find((icon) => icon.name === $fileForm.icon)?.icon}
								size={20}
								strokeWidth={1.5}
								color={$fileForm.iconColor}
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent closeOnScroll={false}>
						<Command class="command" label="Search for an icon">
							<div class="command-header">
								<CommandInput placeholder="Search..." autofocus={isIconPopoverOpen} />
								<Popover bind:isOpen={isIconColorPopoverOpen}>
									<PopoverTrigger>
										<Button variant="outline" type="button" icon>
											<div
												class="icon-color-swatch"
												style="background-color: {$fileForm.iconColor}"
											/>
										</Button>
										<PopoverContent class="icon-color-popover">
											{#each iconColors as color}
												<Button
													variant="ghost"
													type="button"
													icon
													size="sm"
													on:click={(ev) => {
														ev.stopPropagation()
														ev.preventDefault()
														selectIconColor(color.color)
													}}
												>
													<div
														class="icon-color-swatch"
														style="background-color: {color.color}"
														title={color.name}
													/>
												</Button>
											{/each}
										</PopoverContent>
									</PopoverTrigger>
								</Popover>
							</div>
							<CommandList class="command-list">
								<div class="command-list-items">
									{#each fileIcons as icon}
										<CommandItem
											value={icon.name}
											onSelect={() => handleIconSelect(icon.name)}
											class="command-icon command-item"
											title={icon.name}
											data-is-selected={$fileForm.icon === icon.name}
										>
											<svelte:component
												this={icon.icon}
												size={20}
												strokeWidth={1.5}
												color={$fileForm.iconColor}
											/>
										</CommandItem>
									{/each}
								</div>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				<Label class="file-icon-label" for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					class="file-icon-input"
					value={$fileForm.name}
					placeholder="Enter a file name"
					autofocus={fileDialog?.open}
					on:input={handleFileNameChange}
				/>
				<ErrorMessage class="file-icon-error" error={$errors.name} />
			</div>
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

	.file-icon {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: repeat(3, auto);
		gap: var(--space-sm);
	}

	.command-header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-sm);
	}

	.icon-color-swatch {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 100vmax;
	}

	:global(.icon-color-popover) {
		display: grid !important;
		grid-template-columns: repeat(3, 2rem);
		grid-template-rows: repeat(2, 2rem);
		width: fit-content !important;
		min-width: unset !important;
		gap: var(--space-xs);
		background-color: var(--base);
		padding: var(--space-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
	}

	:global(.file-form-dialog) {
		max-width: 500px;
		width: 100%;
		padding: var(--space-xl);
	}

	:global(.file-icon-popover) {
		grid-column: 1;
		grid-row: 2;
	}

	:global(.file-icon-input) {
		grid-column: 2;
		grid-row: 2;
	}

	:global(.file-icon-label) {
		grid-column: 2;
		grid-row: 1;
	}

	:global(.file-icon-error) {
		grid-column: 2;
		grid-row: 3;
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

	.command-list-items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(26px, 1fr));
		gap: 0.35rem;
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

	:global(.command-icon) {
		aspect-ratio: 1 / 1;
		justify-content: center;
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

<script lang="ts">
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Dialog } from '$lib/components/dialog'
	import { onMount } from 'svelte'
	import { treeStore, type File } from '$lib/components/file-tree/treeStore'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { getAllFilesFromTree } from '$lib/utilts/helpers'
	import { isFolder } from '$lib/utilts/tree'
	import SearchFile from './SearchFile.svelte'
	import { goto } from '$app/navigation'

	export let searchDialog: HTMLDialogElement
	let searchValue = ''
	let isLoading: string | null = null

	$: treeFiles = getAllFilesFromTree($treeStore.flat().filter((i) => isFolder(i)))
	$: rootFiles = $treeStore.flat().filter((i) => !isFolder(i))
	$: githubFiles = getAllFilesFromTree($githubTree.flat().filter((i) => isFolder(i)))
	$: rootGithubFiles = $githubTree.flat().filter((i) => !isFolder(i))
	$: files = [...treeFiles, ...githubFiles, ...rootFiles, ...rootGithubFiles].sort((a, b) => {
		return b.updatedAt.getTime() - a.updatedAt.getTime()
	}) as File[]

	onMount(() => {
		const toggleSearchDialog = (ev: KeyboardEvent) => {
			if (ev.key === 'k' && ev.metaKey) {
				ev.preventDefault()
				searchDialog.showModal()
			}
		}

		window.addEventListener('keydown', toggleSearchDialog)
		return () => {
			window.removeEventListener('keydown', toggleSearchDialog)
		}
	})

	const handleSelect = async (file: File) => {
		isLoading = file.id
		await goto(`/${file.id}`)
		isLoading = null
		searchDialog.close()
	}
</script>

<Dialog
	bind:dialog={searchDialog}
	on:close={() => (searchValue = '')}
	withClose={false}
	class="search-dialog"
>
	<Command>
		<CommandInput bind:value={searchValue} autofocus={searchDialog?.open} placeholder="Search..." />
		<CommandList class="search-command-list">
			<ul>
				{#each files as file}
					<CommandItem
						value={file.name ?? 'Untitled'}
						class="search-file-item"
						onSelect={() => handleSelect(file)}
					>
						<SearchFile
							{file}
							{isLoading}
							isGithubFile={[...rootGithubFiles, ...githubFiles].some((i) => i.id === file.id)}
						/>
					</CommandItem>
				{/each}
			</ul>
		</CommandList>
	</Command>
</Dialog>

<style>
	:global(.search-dialog) {
		max-width: 700px;
		width: 100%;
		max-height: 800px;
		height: 100%;
		padding: var(--space-base);
	}

	:global(.search-command-list) {
		overflow-y: auto;
		max-height: 100%;
		overscroll-behavior: contain;
		margin-top: var(--space-base);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	:global(.search-file-item[data-selected='true']) {
		background-color: var(--secondary);
		border-radius: var(--border-radius-sm);
	}
</style>

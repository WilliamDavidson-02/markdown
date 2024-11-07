<script lang="ts">
	import { Editor } from '$lib/components/editor'
	import { Nav } from '$lib/components/nav'
	import { FileForm } from '$lib/components/file-form'
	import { FolderForm } from '$lib/components/folder-form'
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { editorStore } from '$lib/components/editor/editorStore'
	import { selectedFile, treeStore } from '$lib/components/file-tree/treeStore.js'
	import type { fileTable } from '$lib/db/schema.js'
	import { Trash } from '$lib/components/trash'
	import { trashStore } from '$lib/components/trash/trashStore.js'
	import { Settings } from '$lib/components/settings'
	import { settingsContext } from '$lib/components/settings/settingsContext'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore.js'
	import { repositoryBranchesFormStore } from '$lib/components/git-push-form/repositoryBranchesStore.js'
	import { Workspace, workspaceContext } from '$lib/components/workspace'

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement
	let trashDialog: HTMLDialogElement
	let settingsDialog: HTMLDialogElement

	$: isCurrentDocGithub = data.githubIds.fileIds.includes(data.currentDoc?.id ?? '')

	const settings = settingsContext({
		installations: data.installations,
		availableRepositories: data.availableRepositories,
		repositoriesForm: data.repositoriesForm
	})
	workspaceContext()

	const setDoc = (currentDoc: typeof fileTable.$inferSelect) => {
		$editorStore?.dispatch({
			changes: { from: 0, to: $editorStore?.state.doc?.length ?? 0, insert: currentDoc?.doc ?? '' }
		})

		selectedFile.set({ ...currentDoc, isGithub: isCurrentDocGithub })
	}

	onMount(async () => {
		if (data.currentDoc?.id !== $page.url.pathname.split('/').pop()) {
			await goto(`/${data.currentDoc?.id}`)
		}
	})

	$: if (
		data.currentDoc &&
		$editorStore &&
		($selectedFile?.id !== data.currentDoc.id ||
			data.currentDoc?.updatedAt !== $selectedFile?.updatedAt)
	) {
		setDoc(data.currentDoc)
	}
	$: treeStore.set(data.tree)
	$: trashStore.set(data.trashedTree)
	$: githubTree.set(data.githubTree)
	$: settings.set({
		installations: data.installations,
		availableRepositories: data.availableRepositories,
		repositoriesForm: data.repositoriesForm
	})
	$: repositoryBranchesFormStore.set(data.repositoryBranchesForm)
</script>

<main>
	<FileForm bind:fileDialog form={data.fileForm} />
	<FolderForm bind:folderDialog form={data.folderForm} />
	<Trash bind:trashDialog />
	<Settings bind:settingsDialog />
	<Nav {trashDialog} {fileDialog} {folderDialog} {settingsDialog} {isCurrentDocGithub} />
	<Workspace />
</main>

<style>
	main {
		display: flex;
		max-height: 100svh;
	}
</style>

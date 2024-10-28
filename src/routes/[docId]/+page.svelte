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

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement
	let trashDialog: HTMLDialogElement

	const setDoc = (currentDoc: typeof fileTable.$inferSelect) => {
		$editorStore?.dispatch({
			changes: { from: 0, to: $editorStore?.state.doc?.length ?? 0, insert: currentDoc?.doc ?? '' }
		})
		selectedFile.set(currentDoc)
	}

	onMount(async () => {
		if (data.currentDoc?.id !== $page.url.pathname.split('/').pop()) {
			await goto(`/${data.currentDoc?.id}`)
		}
	})

	$: if (data.currentDoc && $editorStore && $selectedFile?.id !== data.currentDoc.id)
		setDoc(data.currentDoc)
	$: treeStore.set(data.tree)
	$: trashStore.set(data.trashedTree)
</script>

<main>
	<FileForm bind:fileDialog form={data.fileForm} />
	<FolderForm bind:folderDialog form={data.folderForm} />
	<Trash bind:trashDialog />

	<Nav {trashDialog} {fileDialog} {folderDialog} />
	<Editor />
</main>

<style>
	main {
		display: flex;
		min-height: 100svh;
	}
</style>

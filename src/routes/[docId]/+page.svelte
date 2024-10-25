<script lang="ts">
	import { Editor } from '$lib/components/editor'
	import { Nav } from '$lib/components/nav'
	import { FileForm } from '$lib/components/file-form'
	import { FolderForm } from '$lib/components/folder-form'
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { editorStore } from '$lib/components/editor/editorStore'
	import { treeStore } from '$lib/components/file-tree/treeStore.js'
	import type { fileTable } from '$lib/db/schema.js'

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement

	const setDoc = (currentDoc: typeof fileTable.$inferSelect) => {
		$editorStore?.dispatch({
			changes: { from: 0, to: $editorStore?.state.doc?.length ?? 0, insert: currentDoc?.doc ?? '' }
		})
	}

	$: if (data.currentDoc) setDoc(data.currentDoc)

	onMount(async () => {
		if (data.currentDoc?.id !== $page.url.pathname.split('/').pop()) {
			await goto(`/${data.currentDoc?.id}`)
		}

		treeStore.set(data.tree)
		if (data.currentDoc) setDoc(data.currentDoc)
	})
</script>

<main>
	<FileForm bind:fileDialog form={data.fileForm} />
	<FolderForm bind:folderDialog form={data.folderForm} />

	<Nav {fileDialog} {folderDialog} />
	<Editor />
</main>

<style>
	main {
		display: flex;
		min-height: 100svh;
	}
</style>

<script lang="ts">
	import { Editor } from '$lib/components/editor'
	import { Nav } from '$lib/components/nav'
	import { FileForm } from '$lib/components/file-form'
	import { FolderForm } from '$lib/components/folder-form'

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement
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

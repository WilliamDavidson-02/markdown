<script lang="ts">
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
	import { githubIds, githubTree } from '$lib/components/github-tree/githubTreeStore.js'
	import { repositoryBranchesFormStore } from '$lib/components/git-push-form/repositoryBranchesStore.js'
	import { Workspace, WORKSPACE_CONTEXT_NAME, workspaceContext } from '$lib/components/workspace'
	import { editorKeymaps } from '$lib/components/editor/commands.js'
	import { Search } from '$lib/components/search'
	import { NAV_CONTEXT_NAME, navContext } from '$lib/components/nav/store'

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement
	let trashDialog: HTMLDialogElement
	let settingsDialog: HTMLDialogElement
	let searchDialog: HTMLDialogElement
	$: isCurrentDocGithub = data.githubIds.fileIds.includes(data.currentDoc?.id ?? '')
	$: showGithubPanel = isCurrentDocGithub
	$: initialSettings = {
		installations: data.installations,
		availableRepositories: data.availableRepositories,
		repositoriesForm: data.repositoriesForm,
		passwordResetForm: data.passwordResetForm,
		emailForm: data.emailForm,
		user: data.user,
		editorSettings: data.editorSettings,
		editorSettingsForm: data.editorSettingsForm,
		keybindingForm: data.keybindingForm,
		editorKeymaps: editorKeymaps(data.keybindings)
	}

	const settings = settingsContext(initialSettings)
	const workspaceStore = workspaceContext()
	const navStore = navContext()

	const setDoc = (currentDoc: typeof fileTable.$inferSelect) => {
		const doc = currentDoc?.doc ?? ''

		$editorStore?.dispatch({
			changes: { from: 0, to: $editorStore?.state.doc?.length ?? 0, insert: doc }
		})

		selectedFile.set({ ...currentDoc, isGithub: isCurrentDocGithub, doc })
	}

	onMount(async () => {
		if (data.currentDoc?.id !== $page.url.pathname.split('/').pop()) {
			await goto(`/${data.currentDoc?.id}`)
		}

		const localNavContext = window.localStorage.getItem(NAV_CONTEXT_NAME)
		if (localNavContext) navStore.set(JSON.parse(localNavContext))

		const localWorkspaceContext = window.localStorage.getItem(WORKSPACE_CONTEXT_NAME)
		if (localWorkspaceContext) workspaceStore.set(JSON.parse(localWorkspaceContext))
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
	$: settings.set(initialSettings)
	$: repositoryBranchesFormStore.set(data.repositoryBranchesForm)
	$: githubIds.set(data.githubIds)
</script>

<main>
	<FileForm bind:fileDialog form={data.fileForm} isGithubTreeShown={showGithubPanel} />
	<FolderForm bind:folderDialog form={data.folderForm} isGithubTreeShown={showGithubPanel} />
	<Trash bind:trashDialog />
	<Settings bind:settingsDialog />
	<Search bind:searchDialog />
	<Nav
		{searchDialog}
		{trashDialog}
		{fileDialog}
		{folderDialog}
		{settingsDialog}
		bind:showGithubPanel
	/>
	<Workspace />
</main>

<style>
	main {
		display: flex;
		max-height: 100svh;
	}
</style>

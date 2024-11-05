<script lang="ts">
	import { Button } from '$lib/components/button'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { getFoldersToFilePos, getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'
	import { isFolder } from '$lib/utilts/tree'
	import { slide } from 'svelte/transition'
	import PullDialog from './PullDialog.svelte'
	import { GitPushForm } from '$lib/components/git-push-form'

	$: folders = $githubTree.flat().filter((f) => isFolder(f))
	$: rootFolder = getFoldersToFilePos(folders, $selectedFile?.id ?? '')[0]
	$: folderIds = rootFolder ? getNestedFolderIds([rootFolder]) : []
	$: fileIds = rootFolder ? getNestedFileIds([rootFolder]) : []

	let pullDialog: HTMLDialogElement
	let showGitPushForm = false
</script>

<PullDialog bind:pullDialog {rootFolder} {fileIds} {folderIds} />
<GitPushForm
	bind:showGitPushForm
	{rootFolder}
	selectedItem={{ id: $selectedFile?.id ?? '', name: $selectedFile?.name ?? '', type: 'file' }}
/>

<div transition:slide={{ axis: 'y' }} class="github-header">
	<div>
		<GithubIcon size={20} />
		<a href={`https://github.com/${rootFolder?.name}`} target="_blank">
			{rootFolder?.name}
		</a>
	</div>
	<div>
		<Button variant="outline" on:click={() => pullDialog.showModal()}>Pull</Button>
		<Button variant="outline" on:click={() => (showGitPushForm = true)}>Push</Button>
	</div>
</div>

<style>
	.github-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) var(--space-base);
		background-color: var(--base);
		color: var(--foreground-dk);
		border-bottom: 1px solid var(--secondary-dk);
	}

	.github-header > div {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	a {
		font-size: 0.875rem;
		line-height: 1rem;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	a:active {
		text-decoration: underline;
	}

	@media (pointer: fine) {
		a:hover {
			text-decoration: underline;
		}
	}
</style>

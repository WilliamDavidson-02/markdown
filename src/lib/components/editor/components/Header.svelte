<script lang="ts">
	import { Button } from '$lib/components/button'
	import { navStore } from '$lib/components/nav/store'
	import { ChevronsRight, ChevronsLeft } from 'lucide-svelte'
	import { HeaderMenu, HeaderTitle } from '../'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { getFoldersToFilePos } from '$lib/utilts/helpers'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'
	import { isFolder } from '$lib/utilts/tree'
	import { slide } from 'svelte/transition'

	$: folders = $selectedFile ? $githubTree.flat().filter((f) => isFolder(f)) : []
	$: rootFolder = getFoldersToFilePos(folders, $selectedFile?.id ?? '')[0]
</script>

<header>
	{#if $selectedFile?.isGithub}
		<div transition:slide={{ axis: 'y' }} class="github-header">
			<div>
				<GithubIcon size={20} />
				<a href={`https://github.com/${rootFolder?.name}`} target="_blank">
					{rootFolder?.name}
				</a>
			</div>
			<div>
				<Button variant="outline">Pull</Button>
				<Button variant="outline">Push</Button>
			</div>
		</div>
	{/if}
	<nav>
		<Button icon size="sm" variant="ghost" on:click={() => navStore.update((state) => !state)}>
			{#if $navStore}
				<ChevronsLeft size={20} stroke-width={1.5} />
			{:else}
				<ChevronsRight size={20} stroke-width={1.5} />
			{/if}
		</Button>
		<HeaderTitle />
		<HeaderMenu />
	</nav>
</header>

<style>
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--space-base);
		background-color: var(--secondary);
		color: var(--foreground-dk);
		height: var(--header-height, 40px);
	}

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

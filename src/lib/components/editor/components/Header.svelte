<script lang="ts">
	import { Button } from '$lib/components/button'
	import { navStore } from '$lib/components/nav/store'
	import { ChevronsRight, ChevronsLeft } from 'lucide-svelte'
	import { HeaderMenu, HeaderTitle } from '../'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import GithubHeader from './GithubHeader.svelte'

	export let headerElement: HTMLElement
</script>

<header bind:this={headerElement}>
	{#if $selectedFile?.isGithub}
		<GithubHeader />
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
</style>

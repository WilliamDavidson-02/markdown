<script lang="ts">
	import { Button } from '$lib/components/button'
	import { getNavContext, NAV_CONTEXT_NAME } from '$lib/components/nav/store'
	import { ChevronsRight, ChevronsLeft } from 'lucide-svelte'
	import { HeaderMenu, HeaderTitle } from '../'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import GithubHeader from './GithubHeader.svelte'

	export let headerElement: HTMLElement
	const navContext = getNavContext()

	const toggleNav = () => {
		const open = !$navContext.open
		navContext.update((state) => ({ ...state, open }))
		window.localStorage.setItem(NAV_CONTEXT_NAME, JSON.stringify({ ...$navContext, open }))
	}
</script>

<header bind:this={headerElement}>
	{#if $selectedFile?.isGithub}
		<GithubHeader />
	{/if}
	<nav>
		<Button icon size="sm" variant="ghost" on:click={toggleNav}>
			{#if $navContext.open}
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

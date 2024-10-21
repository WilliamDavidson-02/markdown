<script lang="ts">
	import { Button } from '$lib/components/button'
	import { navStore } from '$lib/components/nav/store'
	import { ChevronsRight, ChevronsLeft } from 'lucide-svelte'
</script>

<header>
	<Button on:click={() => navStore.update((state) => !state)}>
		{#if $navStore}
			<ChevronsLeft size={20} stroke-width={1.5} />
		{:else}
			<ChevronsRight size={20} stroke-width={1.5} />
		{/if}
	</Button>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		padding: 0 var(--space-base);
		background-color: var(--base);
		color: var(--foreground-dk);
		height: var(--header-height, 40px);
	}
</style>

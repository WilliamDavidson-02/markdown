<script lang="ts">
	import { Button } from '$lib/components/button'
	import { CirclePlus } from 'lucide-svelte'
	import { getSettings } from '../settingsContext'
	import EmptyConnections from './EmptyConnections.svelte'
	import ConnectionItem from './ConnectionItem.svelte'
	import { PUBLIC_GITHUB_INSTALLATION_URL } from '$env/static/public'

	const settings = getSettings()
</script>

<div>
	{#if $settings?.installations.length === 0}
		<EmptyConnections />
	{:else}
		{#each $settings?.availableRepositories ?? [] as installation}
			<ConnectionItem {installation} />
		{/each}
		<Button variant="outline" href={PUBLIC_GITHUB_INSTALLATION_URL}>
			<CirclePlus size={16} stroke-width={1.5} />
			Connect new Github Org
		</Button>
	{/if}
</div>

<style>
	div {
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
</style>

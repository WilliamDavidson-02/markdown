<script lang="ts">
	import { Button } from '$lib/components/button'
	import { CirclePlus } from 'lucide-svelte'
	import { getSettings } from '../settingsContext'
	import EmptyConnections from './EmptyConnections.svelte'
	import ConnectionItem from './ConnectionItem.svelte'

	const settings = getSettings()

	$: availableRepositories = $settings?.availableRepositories ?? []
	$: installations = $settings?.installations ?? []
</script>

<div>
	{#if installations.length === 0}
		<EmptyConnections />
	{:else}
		{#each availableRepositories as installation}
			<ConnectionItem {installation} />
		{/each}
		<Button
			variant="outline"
			href={'https://github.com/apps/markdown-labs/installations/select_target'}
		>
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

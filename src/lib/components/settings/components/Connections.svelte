<script lang="ts">
	import { Button } from '$lib/components/button'
	import { CirclePlus } from 'lucide-svelte'
	import { getSettings } from '../settingsContext'
	import EmptyConnections from './EmptyConnections.svelte'

	const settings = getSettings()

	$: installations = $settings?.installations ?? []
</script>

<div>
	{#if installations.length === 0}
		<EmptyConnections />
	{:else}
		<Button href={'https://github.com/apps/markdown-labs/installations/select_target'}>
			<CirclePlus />
			Connect new Github Org
		</Button>
	{/if}
</div>

<style>
	div {
		height: 100%;
	}
</style>

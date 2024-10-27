<script lang="ts">
	import type { TrashItem } from '../types'
	import { fileIcons } from '$lib/fileIcons'

	export let item: TrashItem

	$: fileIcon = fileIcons.find((icon) => icon.name === item.icon)
</script>

<div>
	{#if fileIcon}
		<svelte:component
			this={fileIcon?.icon}
			size={20}
			color={item.color ?? 'var(--interactive-active)'}
		/>
	{/if}
	<slot />
</div>

<style>
	div {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 1rem;
		line-height: 20px;
		color: var(--foreground-dk);
	}
</style>

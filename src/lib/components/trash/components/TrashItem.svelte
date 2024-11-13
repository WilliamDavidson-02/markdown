<script lang="ts">
	import type { TrashItem } from '../types'
	import { fileIcons, iconColors } from '$lib/fileIcons'

	export let item: TrashItem

	$: fileIcon = fileIcons.find((icon) => icon.name === item.icon)
	$: color = iconColors.find((c) => c.color === item.color)?.color ?? iconColors[0].color
</script>

<div>
	{#if fileIcon}
		<svelte:component this={fileIcon?.icon} size={20} {color} />
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
		padding-left: var(--space-sm);
	}
</style>

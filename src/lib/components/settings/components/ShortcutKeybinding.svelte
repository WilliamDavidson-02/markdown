<script lang="ts">
	import {
		Command,
		Option,
		ArrowBigUp,
		ChevronUp,
		ArrowUp,
		ArrowDown,
		ArrowLeft,
		ArrowRight,
		CornerDownLeft,
		Delete
	} from 'lucide-svelte'

	export let keybinding: string
	$: keys = keybinding.split('-')

	const icons = new Map([
		['Mod', Command],
		['Ctrl', ChevronUp],
		['Alt', Option],
		['Shift', ArrowBigUp],
		['ArrowUp', ArrowUp],
		['ArrowDown', ArrowDown],
		['ArrowLeft', ArrowLeft],
		['ArrowRight', ArrowRight],
		['Enter', CornerDownLeft],
		['Backspace', Delete]
	])
</script>

<div>
	{#each keys as key}
		{#if icons.get(key)}
			<svelte:component this={icons.get(key)} size={20} stroke-width={1.5} />
		{:else}
			{key.length === 1 ? key.toUpperCase() : key}
		{/if}
	{/each}
</div>

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		color: var(--foreground-md);
		font-size: 1.25rem;
	}
</style>

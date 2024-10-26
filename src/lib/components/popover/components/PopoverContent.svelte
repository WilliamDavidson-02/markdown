<script lang="ts">
	import { scale } from 'svelte/transition'
	import { getPopover } from '../popover'
	import type { PopoverContent } from '../types'
	import { onMount } from 'svelte'

	type $$Props = PopoverContent
	let className: $$Props['class'] = undefined
	export { className as class }

	let el: HTMLDivElement

	const popover = getPopover()

	onMount(() => {
		const handleClickOutside = (ev: MouseEvent) => {
			if (
				!el?.contains(ev.target as Node) &&
				!(ev.target as HTMLElement).closest('[role="button"]')
			) {
				popover?.update(() => ({ isOpen: false }))
			}
		}

		window.addEventListener('click', handleClickOutside)

		return () => window.removeEventListener('click', handleClickOutside)
	})
</script>

{#if $popover?.isOpen}
	<div
		bind:this={el}
		transition:scale={{ start: 0.98, duration: 250 }}
		class={className ?? 'default'}
		{...$$restProps}
	>
		<slot />
	</div>
{/if}

<style>
	div {
		position: absolute;
		z-index: 100;
	}

	.default {
		top: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(var(--space-sm));
		min-width: 200px;
	}
</style>

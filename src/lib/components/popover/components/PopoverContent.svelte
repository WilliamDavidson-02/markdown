<script lang="ts">
	import { scale } from 'svelte/transition'
	import { getPopover } from '../popover'
	import type { PopoverContent } from '../types'
	import { onMount } from 'svelte'

	type $$Props = PopoverContent
	let className: $$Props['class'] = ''
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
		class={className}
		{...$$restProps}
	>
		<slot />
	</div>
{/if}

<style>
	div {
		position: absolute;
		top: 100%;
		z-index: 100;
		transform: translateX(-25%) translateY(var(--space-sm));
		min-width: 200px;
	}
</style>

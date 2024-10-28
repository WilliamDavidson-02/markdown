<script lang="ts">
	import { scale } from 'svelte/transition'
	import { getPopover } from '../popover'
	import type { PopoverContent } from '../types'
	import { onMount } from 'svelte'

	type $$Props = PopoverContent
	let className: $$Props['class'] = undefined
	export { className as class }

	let el: HTMLDivElement
	let position = { top: 0, left: 0 }

	const popover = getPopover()

	const calculatePosition = () => {
		if (!el || !$popover?.target) return

		const targetRect = $popover.target.getBoundingClientRect()
		const contentRect = el.getBoundingClientRect()
		const { innerWidth, innerHeight } = window
		const padding = 8

		let top = targetRect.bottom + padding
		let left = targetRect.right - contentRect.width / 2

		// Place above if content will go off bottom of the screen
		if (top + contentRect.height > innerHeight) {
			top = targetRect.top - contentRect.height - padding
		}

		if (left < padding) {
			left = padding
		} else if (left + contentRect.width > innerWidth - padding) {
			left = targetRect.right - contentRect.width
		}

		position = { top, left }
	}

	onMount(() => {
		const closePopover = () => {
			popover?.update(($state) => ({ ...$state, isOpen: false }))
		}

		const handleClickOutside = (ev: MouseEvent) => {
			if (
				!el?.contains(ev.target as Node) &&
				!(ev.target as HTMLElement).closest('[role="button"]')
			) {
				closePopover()
			}
		}

		window.addEventListener('click', handleClickOutside)
		window.addEventListener('resize', calculatePosition)
		document.addEventListener('scroll', closePopover, true)

		return () => {
			window.removeEventListener('click', handleClickOutside)
			window.removeEventListener('resize', calculatePosition)
			document.removeEventListener('scroll', closePopover, true)
		}
	})

	$: if ($popover?.isOpen && el) {
		calculatePosition()
	}
</script>

{#if $popover?.isOpen}
	<div
		bind:this={el}
		transition:scale={{ start: 0.98, duration: 250 }}
		class={className}
		style="top: {position.top}px; left: {position.left}px;"
		{...$$restProps}
	>
		<slot />
	</div>
{/if}

<style>
	div {
		position: fixed;
		z-index: 9999;
		min-width: 200px;
		width: max-content;
		box-shadow: var(--shadow-overlay);
	}
</style>

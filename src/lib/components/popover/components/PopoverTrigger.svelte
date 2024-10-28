<script lang="ts">
	import type { HTMLDivAttributes } from '$lib/types'
	import { getPopover } from '../popover'

	type $$Props = HTMLDivAttributes

	const popover = getPopover()
	let target: HTMLElement | undefined

	const togglePopover = () => {
		popover?.update(($state) => ({ ...$state, isOpen: !$state.isOpen }))
	}

	const handleKeyDown = (ev: KeyboardEvent) => {
		if (ev.key === 'Enter') togglePopover()
	}

	$: if (target) popover?.update(($state) => ({ ...$state, target }))
</script>

<!-- svelte-ignore a11y-interactive-supports-focus -->
<div
	{...$$restProps}
	role="button"
	on:click|stopPropagation={togglePopover}
	on:keydown|stopPropagation={handleKeyDown}
	bind:this={target}
>
	<slot />
</div>

<style>
	div:not(:disabled) {
		cursor: pointer;
	}
</style>

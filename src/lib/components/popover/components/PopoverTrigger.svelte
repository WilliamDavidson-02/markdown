<script lang="ts">
	import type { HTMLDivAttributes } from '$lib/types'
	import { getPopover } from '../popover'

	type $$Props = HTMLDivAttributes

	const popover = getPopover()

	const togglePopover = () => {
		popover?.update(($state) => ({ isOpen: !$state.isOpen }))
	}

	const handleKeyDown = (ev: KeyboardEvent) => {
		if (ev.key === 'Enter') togglePopover()
	}
</script>

<!-- svelte-ignore a11y-interactive-supports-focus -->
<div role="button" on:click={togglePopover} on:keydown={handleKeyDown} {...$$restProps}>
	<slot />
</div>

<style>
	div:not(:disabled) {
		cursor: pointer;
	}
</style>

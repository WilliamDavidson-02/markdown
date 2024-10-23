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

<div
	role="button"
	on:click={togglePopover}
	tabindex={-1}
	on:keydown={handleKeyDown}
	{...$$restProps}
>
	<slot />
</div>

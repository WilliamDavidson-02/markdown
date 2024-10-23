<script lang="ts">
	import { onMount } from 'svelte'
	import { createPopover } from '../popover'
	const popover = createPopover()

	onMount(() => {
		const closePopover = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') {
				ev.preventDefault()
				popover?.update(() => ({ isOpen: false }))
			}
		}

		window.addEventListener('keydown', closePopover)

		return () => window.removeEventListener('keydown', closePopover)
	})
</script>

<div>
	<slot />
</div>

<style>
	div {
		position: relative;
	}
</style>

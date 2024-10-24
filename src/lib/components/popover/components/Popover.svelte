<script lang="ts">
	import { onMount } from 'svelte'
	import { createPopover } from '../popover'
	import type { PopoverProps } from '../types'

	type $$Props = PopoverProps
	export let isOpen: $$Props['isOpen'] = undefined
	let className: $$Props['class'] = undefined
	export { className as class }

	const popover = createPopover({ isOpen })

	$: popover.set({ isOpen: isOpen ?? false })

	$: isOpen = $popover.isOpen

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

<div class={className}>
	<slot />
</div>

<style>
	div {
		position: relative;
	}
</style>

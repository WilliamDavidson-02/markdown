<script lang="ts">
	import type { DividerProps } from '../index'

	type $$Props = DividerProps
	export let direction: $$Props['direction'] = 'horizontal'
	let className: $$Props['class'] = ''
	export { className as class }
</script>

<div class={`${direction} ${className}`} {...$$restProps} />

<style>
	div {
		background-color: var(--secondary-dk);
	}

	.horizontal {
		width: 100%;
		height: 1px;
	}

	.vertical {
		width: 1px;
		height: 100%;
	}
</style>

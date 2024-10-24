<script lang="ts">
	import type { Props } from '../index.js'

	type $$Props = Props
	export let htmlFor: $$Props['for'] = ''
	export let el: $$Props['el'] = undefined
	let className: $$Props['class'] = undefined
	export { className as class }
</script>

<label bind:this={el} for={htmlFor} class={className} {...$$restProps}>
	<slot />
</label>

<style>
	label {
		font-size: 1rem;
		font-weight: 500;
		line-height: 24px;
		color: var(--foreground-dk);
	}
</style>

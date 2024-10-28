<script lang="ts">
	import type { Props } from '../index.js'

	type $$Props = Props
	export let htmlFor: $$Props['for'] = ''
	export let as: $$Props['as'] = 'label'
</script>

<svelte:element this={as} for={htmlFor} class={$$restProps.class} {...$$restProps}>
	<slot />
</svelte:element>

<style>
	label {
		font-size: 1rem;
		font-weight: 500;
		line-height: 24px;
		color: var(--foreground-dk);
	}
</style>

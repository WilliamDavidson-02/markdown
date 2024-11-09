<script lang="ts">
	import type { ErrorMessageProps } from '../types.js'

	type $$Props = ErrorMessageProps

	export let error: $$Props['error'] = undefined
	let className: $$Props['class'] = undefined
	export { className as class }
</script>

{#if error}
	<p class={className} {...$$restProps}>
		{error}
	</p>
{/if}

<style>
	p {
		color: var(--danger-active);
		font-size: 0.875rem;
		line-height: 20px;
	}
</style>

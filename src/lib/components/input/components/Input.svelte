<script lang="ts">
	import type { Events, Props } from '../index.js'

	type $$Props = Props
	type $$Events = Events

	export let type: $$Props['type'] = 'text'
	export let el: $$Props['el'] = undefined
	export let group: $$Props['group'] = undefined
	export let value: string = ''
</script>

<input
	bind:this={el}
	class={$$restProps.class}
	{type}
	{value}
	on:input={(e) => (value = e.currentTarget.value)}
	{...['radio', 'checkbox'].includes(type ?? '') ? { group } : {}}
	{...$$restProps}
	on:keydown
	on:focus
	on:blur
	on:change
/>

<style>
	input {
		padding: var(--space-sm);
		background-color: var(--secondary);
		color: var(--foreground-dk);
		border: 1px solid var(--secondary-dk);
		border-radius: var(--border-radius-sm);
		outline: none;
	}

	input:disabled {
		cursor: not-allowed;
	}

	input::placeholder {
		color: var(--foreground-li);
	}

	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	input:-webkit-autofill:active {
		-webkit-background-clip: text;
		-webkit-text-fill-color: var(--foreground-dk);
		transition: background-color 5000s ease-in-out 0s;
		box-shadow: inset 0 0 20px 20px var(--secondary);
	}
</style>

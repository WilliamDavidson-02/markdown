<script lang="ts">
	import type { TextareaProps, InputEvents } from '../types'

	type $$Props = TextareaProps
	type $$Events = InputEvents
	export let value: $$Props['value'] = ''
</script>

<textarea
	class={$$restProps.class}
	bind:value
	{...$$restProps}
	on:keydown
	on:focus
	on:blur
	on:change
/>

<style>
	textarea {
		padding: var(--space-sm);
		background-color: var(--secondary);
		color: var(--foreground-dk);
		border: 1px solid var(--secondary-dk);
		border-radius: var(--border-radius-sm);
		outline: none;
	}

	textarea:disabled {
		cursor: not-allowed;
	}

	textarea::placeholder {
		color: var(--foreground-li);
	}

	textarea:-webkit-autofill,
	textarea:-webkit-autofill:hover,
	textarea:-webkit-autofill:focus,
	textarea:-webkit-autofill:active {
		-webkit-background-clip: text;
		-webkit-text-fill-color: var(--foreground-dk);
		transition: background-color 5000s ease-in-out 0s;
		box-shadow: inset 0 0 20px 20px var(--secondary);
	}
</style>

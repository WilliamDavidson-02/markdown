<script lang="ts">
	import type { Events, Props } from '../index.js'

	type $$Props = Props
	type $$Events = Events
	export let href: $$Props['href'] = undefined
	export let type: $$Props['type'] = undefined
	export let el: $$Props['el'] = undefined
	export let variant: $$Props['variant'] = 'primary'
	export let icon: $$Props['icon'] = false
	export let size: $$Props['size'] = 'md'

	const attrs = {
		'data-button-root': '',
		role: href ? undefined : 'button',
		'data-button-icon': icon
	}

	$: classes = `button button-${variant} button-${size} ${$$restProps.class ?? ''}`
</script>

<!-- svelte-ignore a11y-no-static-element-interactions a11y_no_static_element_interactions -->
<svelte:element
	this={href ? 'a' : 'button'}
	bind:this={el}
	type={href ? undefined : type}
	{href}
	{...attrs}
	{...$$restProps}
	class={classes}
	on:click
	on:change
	on:keydown
	on:keyup
	on:mouseenter
	on:mouseleave
	on:mousedown
	on:pointerdown
	on:mouseup
	on:pointerup
>
	<slot />
</svelte:element>

<style>
	.button {
		outline: none;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-sm);
		color: var(--foreground-dk);
		border-radius: var(--border-radius-sm);
		border-width: 1px;
		border-style: solid;
		user-select: none;
		transition: background-color 0.25s;
	}

	.button:disabled {
		cursor: not-allowed;
		filter: brightness(0.8);
	}

	.button-primary {
		background-color: var(--interactive);
		border-color: var(--interactive-active);
		color: var(--interactive-text);
	}

	.button-secondary {
		background-color: var(--secondary);
		border-color: var(--secondary-dk);
	}

	.button-outline {
		background-color: transparent;
		border: 1px solid var(--secondary-dk);
	}

	.button-ghost {
		background-color: transparent;
		border: none;
	}

	.button-ghost[data-button-toggled='true'] {
		background-color: var(--secondary);
	}

	.button-destructive {
		background-color: var(--danger);
		border-color: var(--danger-active);
		color: var(--interactive-text);
	}

	.button-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.75rem;
		font-weight: 400;
	}

	.button-md {
		padding: var(--space-sm) var(--space-base);
		font-size: 0.875rem;
		font-weight: 400;
	}

	.button-lg {
		padding: var(--space-base) var(--space-lg);
		font-size: 1rem;
		font-weight: 500;
	}

	.button-sm[data-button-icon='true'] {
		padding: var(--space-xs);
		min-width: 32px;
		min-height: 32px;
	}

	.button-md[data-button-icon='true'] {
		padding: var(--space-sm);
		min-width: 36px;
		min-height: 36px;
	}

	.button-lg[data-button-icon='true'] {
		padding: var(--space-base);
		min-width: 40px;
		min-height: 40px;
	}

	.button[data-button-icon='true'] {
		aspect-ratio: 1 / 1;
	}

	@media (pointer: fine) {
		.button-destructive:hover:not(:disabled) {
			background-color: var(--danger-active);
		}
		.button-ghost:hover:not(:disabled) {
			background-color: var(--secondary);
		}

		.button-outline:hover:not(:disabled) {
			background-color: var(--secondary);
		}

		.button-primary:hover:not(:disabled) {
			background-color: var(--interactive-active);
		}
		.button-secondary:hover:not(:disabled) {
			background-color: var(--secondary-dk);
		}
	}
</style>

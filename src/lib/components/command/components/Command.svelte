<script lang="ts">
	import type { Action } from 'svelte/action'
	import { commandContext } from '../command.js'
	import type { CommandProps } from '../index.js'

	type $$Props = CommandProps

	export let label: $$Props['label'] = undefined
	export let onKeydown: $$Props['onKeydown'] = undefined

	const { ids: commandIds, commandEl, handleRootKeydown } = commandContext()

	const rootAction: Action = (node) => {
		commandEl.set(node)

		const handleKeyDown = (ev: KeyboardEvent) => {
			onKeydown?.(ev)
			if (ev.defaultPrevented) return
			handleRootKeydown(ev)
		}
		node.addEventListener('keydown', handleKeyDown)

		return {
			destroy() {
				node.removeEventListener('keydown', handleRootKeydown)
			}
		}
	}

	const rootAttrs = {
		role: 'application',
		id: commandIds.root,
		'data-cmdk-root': ''
	}

	const labelAttrs = {
		'data-cmdk-label': '',
		for: commandIds.input,
		id: commandIds.label
	}
</script>

<div use:rootAction {...rootAttrs} class={$$restProps.class} {...$$restProps}>
	<!-- svelte-ignore a11y-label-has-associated-control applied in attrs -->
	<label {...labelAttrs}>{label ?? ''}</label>
	<slot />
</div>

<style>
	div {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	label {
		/* Label from user */
		position: absolute;
		left: -9999px;
	}
</style>

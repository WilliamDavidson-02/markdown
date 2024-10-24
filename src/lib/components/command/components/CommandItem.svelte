<script lang="ts">
	import { onMount } from 'svelte'
	import { getCtx, getState, VALUE_ATTR } from '../command'
	import type { CommandItemProps } from '../index'
	import { nanoid } from 'nanoid'
	import { derived } from 'svelte/store'
	import type { Action } from 'svelte/action'

	type $$Props = CommandItemProps

	export let disabled: $$Props['disabled'] = false
	export let value: string = ''
	export let onSelect: $$Props['onSelect'] = undefined
	export let id: string = nanoid()

	let className: $$Props['class'] = ''
	export { className as class }

	const context = getCtx()
	const state = getState()

	const render = derived(state, ($state) => {
		if (!$state.search) return true
		const currentScore = $state.filtered.items.get(id)
		if (currentScore === undefined) return false
		return currentScore > 0
	})

	let isFirstRender = true

	onMount(() => {
		isFirstRender = false
		const unsub = context.item(id, value)
		return () => unsub
	})

	const selected = derived(state, ($state) => $state.value === value)

	const select = () => {
		state.updateState('value', value, true)
	}

	const handleItemClick = () => {
		select()
		onSelect?.(value)
	}

	const action: Action<HTMLElement> = (node: HTMLElement) => {
		if (!value && node.textContent) {
			value = node.textContent.trim().toLowerCase()
		}
		context.value(id, value)
		node.setAttribute(VALUE_ATTR, value)

		const handlePointerMove = () => {
			if (disabled) return
			select()
		}

		const handleClick = () => {
			if (disabled) return
			handleItemClick()
		}

		node.addEventListener('pointermove', handlePointerMove)
		node.addEventListener('click', handleClick)

		return {
			destroy: () => {
				node.removeEventListener('pointermove', handlePointerMove)
				node.removeEventListener('click', handleClick)
			}
		}
	}

	$: attrs = {
		'aria-disabled': disabled ? true : undefined,
		'aria-selected': $selected ? true : undefined,
		'data-disabled': disabled ? true : undefined,
		'data-selected': $selected ? true : undefined,
		'data-cmdk-item': '',
		'data-value': value,
		role: 'option',
		id
	}
</script>

{#if $render || isFirstRender}
	<div {...attrs} use:action class={className} {...$$restProps}>
		<slot {action} {attrs} />
	</div>
{/if}

<script lang="ts">
	import { Input, type Events, type Props } from '$lib/components/input'
	import { derived, get } from 'svelte/store'
	import { getCtx, getState, ITEM_SELECTOR, VALUE_ATTR } from '../command'
	import type { Action } from 'svelte/action'

	type $$Props = Props
	type $$Events = Events

	const { ids, commandEl } = getCtx()
	const state = getState()
	const search = derived(state, ($state) => $state.search)
	const valueStore = derived(state, ($state) => $state.value)

	export let value: $$Props['value'] = get(search)

	const selectedItemId = derived([valueStore, commandEl], ([$value, $commandEl]) => {
		if (typeof document === 'undefined') return undefined
		const item = $commandEl?.querySelector(`${ITEM_SELECTOR}[${VALUE_ATTR}="${$value}"]`)
		return item?.getAttribute('id')
	})

	const handleValueUpdate = (v: string) => {
		state.updateState('search', v)
	}

	$: handleValueUpdate(value)

	let attrs: Record<string, unknown>

	$: attrs = {
		type: 'text',
		'data-cmdk-input': '',
		autocomplete: 'off',
		autocorrect: 'off',
		spellcheck: false,
		'aria-autocomplete': 'list',
		role: 'combobox',
		'aria-expanded': true,
		'aria-controls': ids.list,
		'aria-labelledby': ids.label,
		'aria-activedescendant': $selectedItemId ?? undefined,
		id: ids.input
	}
</script>

<!-- <Input {...attrs} {...$$restProps} bind:value /> -->
<Input {...attrs} bind:value {...$$restProps} on:keydown on:focus on:blur on:change />

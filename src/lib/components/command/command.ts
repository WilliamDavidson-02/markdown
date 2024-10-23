import { getContext, setContext, tick } from 'svelte'
import { get, writable } from 'svelte/store'
import type { CommandIds, Context, State, StateStore } from './types'
import { commandScore } from './commandScore'
import { nanoid } from 'nanoid'

const NAME = 'Command'
const STATE_NAME = 'CommandState'

export const LIST_SELECTOR = `[data-cmdk-list-sizer]`
export const ITEM_SELECTOR = `[data-cmdk-item]`
export const VALID_ITEM_SELECTOR = `${ITEM_SELECTOR}:not([aria-disabled="true"])`
export const VALUE_ATTR = `data-value`

export const filter: (value: string, search: string) => number = (value, search) =>
	commandScore(value, search)

export const getCtx = () => getContext<Context>(NAME)

export const getState = () => getContext<StateStore>(STATE_NAME)

const createState = () => {
	const defaultState: State = {
		search: '',
		value: '',
		filtered: { count: 0, items: new Map() }
	}

	return writable<State>(defaultState)
}

export const commandContext = () => {
	const state = createState()
	const ids: CommandIds = {
		root: nanoid(),
		list: nanoid(),
		label: nanoid(),
		input: nanoid()
	}

	const items = writable<Map<string, string>>(new Map()) // id, value
	const commandEl = writable<HTMLElement | null>(null)

	const score = (value: string | undefined, search: string) => {
		const formattedValue = value?.toLowerCase().trim()
		return formattedValue ? filter(formattedValue, search) : 0
	}

	const getValidItems = (rootElement?: HTMLElement) => {
		const rootEl = rootElement ?? document.getElementById(ids.root)
		if (!rootEl) return []
		return Array.from(rootEl.querySelectorAll(VALID_ITEM_SELECTOR)).filter(
			(el): el is HTMLElement => (el ? true : false)
		)
	}

	const filterItems = (state: State): State => {
		// If there is no search input, show all items
		if (!state.search) {
			state.filtered.count = get(items).size
			return state
		}

		let itemCount = 0

		// check which items should be included
		for (const [id, value] of get(items)) {
			const rank = score(value, state.search)
			state.filtered.items.set(id, rank)
			if (rank > 0) itemCount++
		}

		state.filtered.count = itemCount
		return state
	}

	const sort = (state: State): State => {
		if (!state.search) return state

		const scores = state.filtered.items

		const rootEl = document.getElementById(ids.root)
		if (!rootEl) return state
		const list = rootEl.querySelector(LIST_SELECTOR)

		const validItems = getValidItems(rootEl).sort((a, b) => {
			const valueA = a.getAttribute(VALUE_ATTR) ?? ''
			const valueB = b.getAttribute(VALUE_ATTR) ?? ''
			return (scores.get(valueA) ?? 0) - (scores.get(valueB) ?? 0)
		})

		for (const item of validItems) {
			if (item.parentElement !== list) continue
			list?.appendChild(item)
		}

		return state
	}

	const selectFirstItem = () => {
		const rootEl = document.getElementById(ids.root) ?? undefined
		const item = getValidItems(rootEl).find((item) => !item.ariaDisabled)
		if (!item) return
		const value = item.getAttribute(VALUE_ATTR)
		if (!value) return
		return value
	}

	const updateState = <K extends keyof State>(key: K, value: State[K]) => {
		state.update((curr) => {
			if (Object.is(curr[key], value)) return curr
			curr[key] = value

			if (key === 'search') {
				curr = sort(filterItems(curr))
				tick().then(() =>
					state.update((curr) => {
						curr.value = selectFirstItem() ?? ''
						return curr
					})
				)
			}

			return curr
		})
	}

	const context: Context = {
		value: (id, value) => {
			if (value !== get(items).get(id)) {
				items.update(($items) => $items.set(id, value))
				state.update(($state) => {
					$state.filtered.items.set(id, score(value, $state.search))
					return $state
				})
			}
		},
		item: (id, value) => {
			items.update(($items) => $items.set(id, value))

			state.update(($state) => {
				const filteredState = filterItems($state)

				if (!filteredState.value) {
					filteredState.value = selectFirstItem() ?? ''
				}

				return filteredState
			})

			// Unsubscribe
			return () => {
				items.update(($items) => {
					$items.delete(id)
					return $items
				}),
					state.update(($state) => {
						$state.filtered.items.delete(id)
						return $state
					})
			}
		},
		ids,
		commandEl
	}

	setContext(NAME, context)

	const stateStore = {
		subscribe: state.subscribe,
		update: state.update,
		set: state.set,
		updateState
	}

	setContext(STATE_NAME, stateStore)

	const getSelectedItem = (rootElement?: HTMLElement) => {
		const rootEl = rootElement ?? document.getElementById(ids.root)
		if (!rootEl) return
		const selectedEl = rootEl.querySelector(`${VALID_ITEM_SELECTOR}[aria-selected="true"]`)
		if (!selectedEl) return
		return selectedEl
	}

	const updateSelectedByChange = (change: 1 | -1) => {
		const selected = getSelectedItem()
		const items = getValidItems()
		const index = items.findIndex((item) => item === selected)

		let newSelected = items[index + change]

		// Handle loop
		if (index + change < 0) {
			newSelected = items[items.length - 1]
		} else if (index + change === items.length) {
			newSelected = items[0]
		} else {
			newSelected = items[index + change]
		}

		if (!newSelected) return
		updateState('value', newSelected.getAttribute(VALUE_ATTR) ?? '')
	}

	const updateSelectedToIndex = (index: number) => {
		const rootEl = document.getElementById(ids.root)
		if (!rootEl) return
		const item = getValidItems(rootEl)[index]
		if (!item) return
		updateState('value', item.getAttribute(VALUE_ATTR) ?? '')
	}

	const last = () => {
		const rootEl = document.getElementById(ids.root) ?? undefined
		return updateSelectedToIndex(getValidItems(rootEl).length - 1)
	}

	const next = (ev: KeyboardEvent) => {
		ev.preventDefault()

		if (ev.metaKey) {
			last()
		} else {
			updateSelectedByChange(1)
		}
	}

	const prev = (ev: KeyboardEvent) => {
		ev.preventDefault()

		if (ev.metaKey) {
			updateSelectedToIndex(0)
		} else {
			updateSelectedByChange(-1)
		}
	}

	const handleRootKeydown = (ev: KeyboardEvent) => {
		switch (ev.key) {
			case 'ArrowDown':
				next(ev)
				break
			case 'ArrowUp':
				prev(ev)
				break
			case 'Home':
				ev.preventDefault()
				updateSelectedToIndex(0)
				break
			case 'End':
				ev.preventDefault()
				last()
				break
			case 'Enter': {
				ev.preventDefault()
				const item = getSelectedItem() as HTMLElement
				if (item) item?.click()
			}
		}
	}

	return {
		state: stateStore,
		ids,
		commandEl,
		handleRootKeydown
	}
}

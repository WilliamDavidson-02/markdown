import { getContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { Popover } from './types'

export const getPopover = () => {
	const context = getContext<Writable<Popover>>('popover')
	if (!context) return undefined
	return context
}

export const createPopover = () => {
	const store = writable<Popover>({ isOpen: false })
	setContext('popover', store)
	return store
}

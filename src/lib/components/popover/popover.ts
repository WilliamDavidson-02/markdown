import { getContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { Popover, PopoverProps } from './types'

export const getPopover = () => {
	const context = getContext<Writable<Popover>>('popover')
	if (!context) return undefined
	return context
}

export const createPopover = (props: PopoverProps) => {
	const store = writable<Popover>({
		isOpen: props.isOpen ?? false,
		target: props.target
	})
	setContext('popover', store)
	return store
}

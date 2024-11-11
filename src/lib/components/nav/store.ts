import { writable, type Writable } from 'svelte/store'
import type { NavContext } from './types'
import { getContext, setContext } from 'svelte'

export const NAV_CONTEXT_NAME = 'navContext'
const defaultNavContext: NavContext = { open: false, width: 400 }

export const getNavContext = () => {
	return getContext<Writable<NavContext>>(NAV_CONTEXT_NAME)
}

export const navContext = () => {
	const store = writable(defaultNavContext)
	setContext(NAV_CONTEXT_NAME, store)
	return store
}

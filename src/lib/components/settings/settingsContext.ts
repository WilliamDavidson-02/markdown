import { getContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { SettingsContext } from './types'

const CONTEXT_KEY = 'settingsContext'

export const getSettings = () => {
	const context = getContext<Writable<SettingsContext>>(CONTEXT_KEY)
	if (!context) return undefined
	return context
}

export const settingsContext = (props: SettingsContext) => {
	const store = writable<SettingsContext>(props)
	setContext(CONTEXT_KEY, store)
	return store
}

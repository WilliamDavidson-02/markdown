import { getContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { WorkspaceView } from './types'

const NAME = 'workspace'

export const getWorkspaceContext = () => {
	return getContext<Writable<{ view: WorkspaceView }>>(NAME)
}

export const workspaceContext = () => {
	const store = writable<{ view: WorkspaceView }>({ view: 'split' })
	setContext(NAME, store)
	return store
}

import { getContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { WorkspaceView } from './types'

export const WORKSPACE_CONTEXT_NAME = 'workspaceContext'

export const getWorkspaceContext = () => {
	return getContext<Writable<{ view: WorkspaceView }>>(WORKSPACE_CONTEXT_NAME)
}

export const workspaceContext = () => {
	const store = writable<{ view: WorkspaceView }>({ view: 'editor' })
	setContext(WORKSPACE_CONTEXT_NAME, store)
	return store
}

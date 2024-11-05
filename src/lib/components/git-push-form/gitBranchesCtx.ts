import type { GithubBranchListItem } from '$lib/utilts/githubTypes'
import { setContext, getContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'

const NAME = 'repositoryBranches'

export const getRepositoryBranches = () => {
	return getContext<Writable<GithubBranchListItem[]>>(NAME)
}

export const setRepositoryBranches = (branches: GithubBranchListItem[]) => {
	const store = writable<GithubBranchListItem[]>(branches)
	setContext(NAME, store)
	return store
}

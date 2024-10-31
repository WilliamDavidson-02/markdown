import { writable } from 'svelte/store'
import type { Tree } from '../file-tree/treeStore'

export const githubTree = writable<Tree>([])

import { writable } from 'svelte/store'
import type { File, Folder } from '../file-tree/treeStore'

export type TrashTree = (File | Folder)[]
export const trashStore = writable<TrashTree>([])

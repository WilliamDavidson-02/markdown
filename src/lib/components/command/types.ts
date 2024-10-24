import type { HTMLDivAttributes } from '$lib/types'
import type { Writable } from 'svelte/store'

export type State = {
	search: string
	value: string
	filtered: {
		count: number
		items: Map<string, number> // id, score
	}
}

export type CommandProps = HTMLDivAttributes & {
	label?: string
	value?: string
	onKeydown?: (e: KeyboardEvent) => void
	class?: string
}

export type CommandListProps = HTMLDivAttributes & {
	class?: string
}

export type CommandItemProps = HTMLDivAttributes & {
	id?: string
	value?: string
	disabled?: boolean
	onSelect?: (value: string) => void
	class?: string
}

export type CommandGroupProps = HTMLDivAttributes & {
	heading?: string
}

export type Context = {
	value: (id: string, value: string) => void
	item: (id: string, value: string) => void
	ids: CommandIds
	commandEl: Writable<HTMLElement | null>
}

export type CommandIds = Record<'root' | 'label' | 'input' | 'list', string>

type UpdateState = <K extends keyof State>(key: K, value: State[K], preventScroll?: boolean) => void

export type StateStore = Writable<State> & {
	updateState: UpdateState
}

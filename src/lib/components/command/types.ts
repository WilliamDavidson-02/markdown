import type { HTMLAttributes } from 'svelte/elements'
import type { Writable } from 'svelte/store'

export type State = {
	search: string
	value: string
	filtered: {
		count: number
		items: Map<string, number> // id, score
	}
}

export type CommandProps = HTMLAttributes<HTMLDivElement> & {
	label?: string
	value?: string
	onKeydown?: (e: KeyboardEvent) => void
}

export type CommandItemProps = HTMLAttributes<HTMLDivElement> & {
	id?: string
	value?: string
	disabled?: boolean
	onSelect?: (value: string) => void
}

export type CommandGroupProps = HTMLAttributes<HTMLDivElement> & {
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

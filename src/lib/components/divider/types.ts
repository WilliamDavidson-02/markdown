import type { HTMLAttributes } from 'svelte/elements'

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
	direction?: 'horizontal' | 'vertical'
	class?: string
}

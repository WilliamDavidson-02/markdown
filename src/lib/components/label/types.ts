import type { HTMLLabelAttributes } from 'svelte/elements'

export type LabelProps = HTMLLabelAttributes & {
	class?: string
	as?: 'label' | 'span'
}

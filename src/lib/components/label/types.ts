import type { HTMLLabelAttributes } from 'svelte/elements'
import type { DOMEl } from '$lib/types'

export type LabelProps = HTMLLabelAttributes & DOMEl<HTMLLabelElement>

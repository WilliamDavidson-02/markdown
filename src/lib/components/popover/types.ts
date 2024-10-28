import type { HTMLDivAttributes } from '$lib/types'

export type Popover = {
	isOpen: boolean
	target?: HTMLElement
}

export type PopoverProps = HTMLDivAttributes & {
	isOpen?: boolean
	class?: string
	target?: HTMLElement
}

export type PopoverContentProps = HTMLDivAttributes & {
	closeOnScroll?: boolean
}

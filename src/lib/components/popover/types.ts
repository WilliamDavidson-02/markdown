import type { HTMLDivAttributes } from '$lib/types'

export type Popover = {
	isOpen: boolean
}

export type PopoverContent = HTMLDivAttributes & {
	class?: string
}

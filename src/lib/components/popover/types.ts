import type { HTMLDivAttributes } from '$lib/types'

export type Popover = {
	isOpen: boolean
}

export type PopoverProps = HTMLDivAttributes & {
	isOpen?: boolean
	class?: string
}

export type PopoverContent = HTMLDivAttributes & {
	class?: string
}

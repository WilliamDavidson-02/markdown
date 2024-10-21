import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
import type { DOMEl } from '$lib/types'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'
type SharedProps = {
	variant?: ButtonVariant
	size?: ButtonSize
	icon?: boolean
}

type AnchorElement = HTMLAnchorAttributes & {
	href?: HTMLAnchorAttributes['href']
	type?: never
} & SharedProps &
	DOMEl<HTMLAnchorElement>

type ButtonElement = HTMLButtonAttributes & {
	type?: HTMLButtonAttributes['type']
	href?: never
} & SharedProps &
	DOMEl<HTMLButtonElement>

export type ButtonProps = AnchorElement | ButtonElement

export type ButtonEventHandler<T extends Event = Event> = T & {
	currentTarget: EventTarget & HTMLButtonElement
}

export type ButtonEvents = {
	click: ButtonEventHandler<MouseEvent>
	keydown: ButtonEventHandler<KeyboardEvent>
	change: ButtonEventHandler<Event>
	keyup: ButtonEventHandler<KeyboardEvent>
	mouseenter: ButtonEventHandler<MouseEvent>
	mouseleave: ButtonEventHandler<MouseEvent>
	mousedown: ButtonEventHandler<MouseEvent>
	mouseup: ButtonEventHandler<MouseEvent>
	pointerdown: ButtonEventHandler<PointerEvent>
	pointerup: ButtonEventHandler<PointerEvent>
}

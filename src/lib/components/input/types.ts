import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements'
import type { DOMEl } from '$lib/types'

export type InputProps = HTMLInputAttributes & {
	type?: HTMLInputTypeAttribute
	group?: string[]
	class?: string
} & DOMEl<HTMLInputElement>

export type InputEventHandler<T extends Event = Event> = T & {
	currentTarget: EventTarget & HTMLInputElement
}

export type InputEvents = {
	change: InputEventHandler<Event>
	focus: InputEventHandler<FocusEvent>
	blur: InputEventHandler<FocusEvent>
	input: InputEventHandler<InputEvent>
	keydown: InputEventHandler<KeyboardEvent>
}

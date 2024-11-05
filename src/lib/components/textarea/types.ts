import type { HTMLAttributes } from 'svelte/elements'

export type TextareaProps = HTMLAttributes<HTMLTextAreaElement> & {
	value: string
	name: string
	id: string
}

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

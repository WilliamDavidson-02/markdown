import type { HTMLAttributes } from 'svelte/elements'

export type ErrorMessageProps = HTMLAttributes<HTMLParagraphElement> & {
	class?: string
	error?: string[]
}

import { EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

const formatLinks = (event: ClipboardEvent | DragEvent, view: EditorView) => {
	event.preventDefault()
	let text: string[] | undefined
	let position = view.state.selection.main.from
	if (event instanceof ClipboardEvent) {
		text = event.clipboardData?.getData('text/plain')?.split('\n')
	} else if (event instanceof DragEvent) {
		position = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? position
		text = event.dataTransfer?.getData('text/plain')?.split('\n')
	}
	if (!text) return

	const insert = text
		.map((line) => {
			const matchedLinks = line.match(/https?:\/\/[^\s]+/g)
			if (!matchedLinks) return line

			matchedLinks.forEach((link) => {
				const isMarkdownLink = /\[.*?\]\(.*?\)/.test(line)
				if (isMarkdownLink) return
				line = line.replace(link, `[${link}](${link})`)
			})
			return line
		})
		.join('\n')

	const changes = view.state.changeByRange(() => {
		return {
			changes: { from: position, insert },
			range: EditorSelection.cursor(position + insert.length)
		}
	})

	view.dispatch(changes)
}

/**
 * Format pasted links to markdown links
 */
export const handleLinks = EditorView.domEventHandlers({
	paste: formatLinks,
	drop: formatLinks
})

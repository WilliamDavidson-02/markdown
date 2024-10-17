import {
	EditorSelection,
	EditorState,
	Transaction,
	type ChangeSpec,
	type Line,
	type SelectionRange
} from '@codemirror/state'
import { EditorView, ViewUpdate } from '@codemirror/view'
import { CompletionContext, type Completion } from '@codemirror/autocomplete'
import { languages } from '@codemirror/language-data'
import type { LineChange } from './types'
import { insertBlankLine } from '@codemirror/commands'

const tableRegex = {
	header: /^\|(.+\|)+/,
	separator: /^\|(\s*:?-+:?\s*\|)+/,
	row: /^\|(.+\|)+/,
	cell: /(?<=\|)([^|]+)(?=\|)/g
}

const isTableLine = (text: string) => {
	if (tableRegex.header.test(text.trim())) return true
	if (tableRegex.separator.test(text.trim())) return true
	if (tableRegex.row.test(text.trim())) return true

	return false
}

const getTableLines = (state: EditorState, range: SelectionRange) => {
	let { number, text } = state.doc.lineAt(range.from)
	let lines: Line[] = []

	if (number < 1 || !isTableLine(text)) {
		return []
	}

	let prevLine = number
	while (prevLine > 0) {
		const line = state.doc.line(prevLine)
		if (!isTableLine(line.text)) {
			break
		}
		lines.unshift(line)
		prevLine--
	}

	let nextLine = number + 1
	while (nextLine <= state.doc.lines) {
		const line = state.doc.line(nextLine)
		if (!isTableLine(line.text)) {
			break
		}
		lines.push(line)
		nextLine++
	}

	return lines
}

const formatTableLines = (lines: Line[]): LineChange[] => {
	const pipeCount = lines[0].text.match(/\|/g)?.length ?? 0
	const columns = Math.ceil(pipeCount / 2)
	let formattedLines: LineChange[] = [...lines].map((line) => ({
		from: line.from,
		to: line.to,
		insert: line.text
	}))

	for (let i = 0; i < columns; i++) {
		let maxWidth = 0

		// Find the max width of the column
		for (const line of lines) {
			if (tableRegex.separator.test(line.text)) continue
			const cells = line.text.match(tableRegex.cell)
			if (!cells) continue

			const width = cells[i].trim().length
			if (width > maxWidth) maxWidth = width
		}

		formattedLines = formattedLines.map((line) => {
			let cells = line.insert.match(tableRegex.cell)
			if (!cells) return line

			const isSeparator = tableRegex.separator.test(line.insert)

			let cell = cells[i].trim()
			let padding = maxWidth - cell.length
			if (padding <= 0) {
				if (isSeparator) {
					const firstIndex = cell.indexOf('-')
					let separator = cell.split('')
					separator.splice(firstIndex, Math.abs(padding))
					cell = separator.join('')
				}
				cells[i] = cell
				const newLine = `|${cells.join('|')}|`
				return {
					...line,
					insert: newLine
				}
			}

			if (isSeparator) {
				const lastIndex = cell.lastIndexOf('-') + 1
				cell = cell.slice(0, lastIndex) + '-'.repeat(padding) + cell.slice(lastIndex)
			} else {
				cell = cell + ' '.repeat(padding)
			}

			cells[i] = cell
			const newLine = `|${cells.join('|')}|`

			return {
				...line,
				insert: newLine
			}
		})
	}

	return formattedLines
}

const getNewCursorPosition = (
	formated: LineChange[],
	range: SelectionRange,
	state: EditorState
) => {
	let lengthChangeBefore = formated[0].from - 1

	formated.forEach((change) => {
		const isAllBefore = change.to <= range.from
		const isPartiallyBefore = change.from <= range.from && change.to >= range.from
		if (isAllBefore) {
			lengthChangeBefore += change.insert.length + 1
		} else if (isPartiallyBefore) {
			const originalLine = state.doc.lineAt(change.from)
			// if there is spacing after the type character in a cell that is still left in the original text
			// but removed in the formated text
			const hasSpacing = originalLine.text.length !== change.insert.length
			const diff = hasSpacing ? 0 : 1
			const diffWithCursor = diff + (range.from - change.from) + (hasSpacing ? 1 : 0)
			lengthChangeBefore += diffWithCursor
		}
	})

	return lengthChangeBefore
}

let resized = false

/**
 * Resizes all table cells to fit the content of the widest cell
 */
export const resizeTable = EditorView.updateListener.of((update: ViewUpdate) => {
	if (!update.docChanged) return
	if (resized) {
		resized = false
		return
	}

	const changes = update.state.changeByRange((range) => {
		const lines = getTableLines(update.state, range)

		if (lines.length < 1) return { range }
		const formated = formatTableLines(lines)

		resized = true // prevent infinite loop

		const cursor = getNewCursorPosition(formated, range, update.state)

		return {
			changes: formated,
			range: EditorSelection.cursor(cursor)
		}
	})

	update.view.dispatch(changes)
})

const applyCodeBlock = (view: EditorView, completion: Completion) => {
	const changes = view.state.changeByRange((range) => {
		const line = view.state.doc.lineAt(range.from)
		const startBlock = `\`\`\`${completion.displayLabel}`
		const insert = `${startBlock}\n\n\`\`\``

		const changes: ChangeSpec[] = [
			{
				from: line.from,
				to: line.to,
				insert
			}
		]

		return { range: EditorSelection.cursor(line.from + startBlock.length + 1), changes }
	})

	if (changes.changes.empty) return

	view.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})
}

/**
 * Markdown autocompletion for the editor
 * @description
 * Adds autocompletion for code blocks
 */
export const completions = (context: CompletionContext) => {
	let word = context.matchBefore(/```\w*/)
	if (word?.from === word?.to && !context.explicit) return null

	const completions: Completion[] = languages
		.filter((lang) => lang.extensions.length > 0)
		.map(
			(lang): Completion => ({
				label: '```' + lang.extensions[0],
				displayLabel: lang.extensions[0],
				apply: applyCodeBlock
			})
		)

	return {
		from: word?.from,
		options: completions
	}
}

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

const isBold = (value: string) => {
	return value.startsWith('**') && value.endsWith('**')
}

const isItalic = (value: string) => {
	return value.startsWith('*') && value.endsWith('*')
}

const selectWordBoundary = (range: SelectionRange, state: EditorState) => {
	let { from, to } = range
	const line = state.doc.lineAt(from)

	while (from > line.from) {
		if (!/\w/.test(line.text[from - line.from - 1])) break
		from--
	}

	while (to < line.to) {
		if (!/\w/.test(line.text[to - line.from])) break
		to++
	}

	return EditorSelection.range(from, to)
}

export const toggleBold = (editor: EditorView) => {
	const changes = editor.state.changeByRange((range) => {
		let newRange = range
		if (range.from === range.to) {
			newRange = selectWordBoundary(range, editor.state)
		}

		const isSelectionBold = isBold(editor.state.doc.sliceString(newRange.from - 2, newRange.to + 2))
		let changes: ChangeSpec[] = []

		if (isSelectionBold) {
			changes = [
				{
					from: newRange.from - 2,
					to: newRange.from
				},
				{
					from: newRange.to,
					to: newRange.to + 2
				}
			]
			newRange = EditorSelection.range(range.from - 2, range.to - 2)
		} else {
			changes = [
				{
					from: newRange.from,
					insert: '**'
				},
				{
					from: newRange.to,
					insert: '**'
				}
			]
			newRange = EditorSelection.range(range.from + 2, range.to + 2)
		}
		return { range: newRange, changes }
	})

	editor.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})

	return true
}

export const toggleItalic = (editor: EditorView) => {
	const changes = editor.state.changeByRange((range) => {
		let newRange = range
		if (range.from === range.to) {
			newRange = selectWordBoundary(range, editor.state)
		}

		const isSelectionItalic = isItalic(
			editor.state.doc.sliceString(newRange.from - 1, newRange.to + 1)
		)
		let changes: ChangeSpec[] = []

		if (isSelectionItalic) {
			changes = [
				{
					from: newRange.from - 1,
					to: newRange.from
				},
				{
					from: newRange.to,
					to: newRange.to + 1
				}
			]
			newRange = EditorSelection.range(range.from - 1, range.to - 1)
		} else {
			changes = [
				{
					from: newRange.from,
					insert: '*'
				},
				{
					from: newRange.to,
					insert: '*'
				}
			]
			newRange = EditorSelection.range(range.from + 1, range.to + 1)
		}
		return { range: newRange, changes }
	})

	editor.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})

	return true
}

const isCheckBox = (value: string) => {
	const checkBoxPattern = /^- \[(x| )\] /i
	return checkBoxPattern.test(value)
}

export const toggleCheckbox = (line: Line, range: SelectionRange) => {
	const startIndex = line.text.indexOf('- [')
	const isChecked = line.text.toLowerCase().includes('- [x]')

	const checkbox = isChecked ? '- [ ]' : '- [x]'

	return {
		from: line.from + startIndex,
		to: line.from + startIndex + checkbox.length,
		insert: checkbox
	}
}

export const handleInsertBlankLine = (editor: EditorView) => {
	const changes = editor.state.changeByRange((range) => {
		let changes: ChangeSpec[] = []
		let from = range.from

		while (from <= range.to) {
			const line = editor.state.doc.lineAt(from)
			if (isCheckBox(line.text)) {
				changes.push(toggleCheckbox(line, range))
				from = line.to + 1
				continue
			}

			break
		}

		return { range, changes }
	})

	if (changes.changes.empty) {
		return insertBlankLine(editor)
	}

	editor.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})

	return true
}

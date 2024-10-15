import { EditorSelection, EditorState, type Line, type SelectionRange } from '@codemirror/state'
import { EditorView, ViewUpdate } from '@codemirror/view'
import type { LineChange } from './types'

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

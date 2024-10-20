import {
	countColumn,
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
import { indentString, syntaxTree } from '@codemirror/language'

const tableRegex = {
	delimiter: /^\|\s*(?:(:?-+:?)\s*\|)+/,
	row: /^\|(.*?)\|/
}

const getTableLines = (state: EditorState, range: SelectionRange): LineChange[] => {
	let lines: LineChange[] = []
	let { number } = state.doc.lineAt(range.from)

	for (let i = number; i >= 0; i--) {
		const { from, to, text } = state.doc.line(i)
		if (!tableRegex.row.test(text)) break
		lines.unshift({ from, to, insert: text })
	}

	for (let i = number + 1; i <= state.doc.lines; i++) {
		const { from, to, text } = state.doc.line(i)
		if (!tableRegex.row.test(text)) break
		lines.push({ from, to, insert: text })
	}

	// Delimiter must be present on the second line
	if (lines.length > 1 && !tableRegex.delimiter.test(lines[1].insert)) {
		return []
	}

	return lines
}

const getCurrentLine = (
	lines: LineChange[],
	main: EditorSelection['main']
): LineChange | undefined => {
	const lineIndex = lines.findIndex((line) => main.from >= line.from && main.to <= line.to)
	if (lineIndex < 0) return undefined
	return lines[lineIndex]
}

/**
 * Formats the current table cell to replace white spaces with the inserted characters
 */
const formatTableCell = (lines: LineChange[], update: ViewUpdate): LineChange[] => {
	const { main } = update.state.selection
	let line = getCurrentLine(lines, main)
	if (!line) return lines

	const basedCursorPos = main.from - line.from
	const closingPipeIndex = line.insert.indexOf('|', basedCursorPos)
	const charBetweenCursorAndPipe = line.insert.slice(basedCursorPos, closingPipeIndex)

	// If there is a character between the cursor and the pipe, we should not replace a white space with the inserted characters
	if (charBetweenCursorAndPipe.trim().length > 0) return lines

	const insertedLength = update.changes.newLength - update.changes.length

	if (insertedLength > 0) {
		const lineChars = line.insert.split('')
		lineChars.splice(
			basedCursorPos,
			charBetweenCursorAndPipe.length >= insertedLength
				? insertedLength
				: charBetweenCursorAndPipe.length
		)
		line.insert = lineChars.join('')
	}

	return lines
}

const getSpacesBeforeFirstChar = (line: LineChange, startIndex: number, endIndex: number) => {
	let firstCharIndex = line.insert.slice(startIndex, endIndex).search(/[^|\s]/)
	return firstCharIndex > -1 ? line.insert.slice(startIndex + 1, startIndex + firstCharIndex) : ''
}

const getSpacesAfterLastChar = (line: LineChange, startIndex: number, endIndex: number) => {
	let lastCharIndex = -1
	const lineChars = line.insert.slice(startIndex, endIndex)
	const lastPipeIndex = lineChars.lastIndexOf('|')
	for (let i = lastPipeIndex; i >= 0; i--) {
		if (!/[|\s]/.test(lineChars[i])) {
			lastCharIndex = i
			break
		}
	}
	return lastCharIndex > -1 ? lineChars.slice(lastCharIndex + 1, endIndex - startIndex - 1) : ''
}

const getColumnBoundaries = (line: LineChange) => {
	return line.insert.split('').reduce((boundaries, char, index) => {
		if (char === '|') boundaries.push(index)
		return boundaries
	}, [] as number[])
}

const formatColumnWidth = (lines: LineChange[], update: ViewUpdate): LineChange[] => {
	const { main } = update.state.selection
	const line = getCurrentLine(lines, main)
	if (!line) return lines

	const columnCount = line.insert.split('').reduce((count, char) => {
		if (char === '|') count++
		return count
	}, -1)

	const basedCursorPos = main.from - line.from

	for (let i = 0; i < columnCount; i++) {
		const columnBoundaries = getColumnBoundaries(line)
		const currentCellStartIndex = columnBoundaries[i]
		const currentCellEndIndex = columnBoundaries[i + 1] + 1
		const spacesBeforeFirstChar = getSpacesBeforeFirstChar(
			line,
			currentCellStartIndex,
			currentCellEndIndex
		)

		// add spaces before the first character of the cell
		lines = lines.map((row): LineChange => {
			const columnBoundaries = getColumnBoundaries(row)
			const startIndex = columnBoundaries[i]
			const endIndex = columnBoundaries[i + 1]
			const rowChars = row.insert.split('')
			if (startIndex < basedCursorPos && row.from !== line.from) {
				const currentSpaces = getSpacesBeforeFirstChar(row, startIndex, endIndex)
				const spacesToAdd = spacesBeforeFirstChar.length - currentSpaces.length
				if (spacesToAdd > 0) {
					rowChars.splice(
						startIndex + 1,
						currentSpaces.length,
						currentSpaces + ' '.repeat(spacesToAdd)
					)
				} else if (spacesToAdd < 0) {
					rowChars.splice(startIndex + 1, currentSpaces.length, currentSpaces.slice(0, spacesToAdd))
				}
			}

			return { ...row, insert: rowChars.join('') }
		})

		const currentCell = line.insert.slice(currentCellStartIndex, currentCellEndIndex)
		const spacesAfterLastChar = getSpacesAfterLastChar(
			line,
			currentCellStartIndex,
			currentCellEndIndex
		)
		let widestCell = lines.reduce(
			(widest, row) => {
				const columnBoundaries = getColumnBoundaries(row)
				const startIndex = columnBoundaries[i]
				const endIndex = columnBoundaries[i + 1] + 1
				const cell = row.insert.slice(startIndex, endIndex)
				const spaces = getSpacesAfterLastChar(row, startIndex, endIndex)
				const isDelimiter = tableRegex.delimiter.test(cell)

				if (row.from !== line.from && !isDelimiter) {
					const currentCellContent = cell.length - spaces.length
					const widestCellContent = widest.insert.length - widest.spaces.length

					if (currentCellContent > widestCellContent) {
						return { insert: cell, from: row.from, spaces }
					}
				}

				if (cell.length > widest.insert.length && !isDelimiter) {
					return { insert: cell, from: row.from, spaces }
				}

				return widest
			},
			{ insert: currentCell, from: line.from, spaces: spacesAfterLastChar }
		)

		/**
		 * Current cell is less then widest cell
		 * as long as the current cell is not shorter then the widest cell minus the spaces after the widest last char
		 */
		if (
			currentCell.length <= widestCell.insert.length &&
			currentCell.length >= widestCell.insert.length - widestCell.spaces.length
		) {
			widestCell = {
				insert: currentCell,
				from: line.from,
				spaces: widestCell.spaces
			}
		}

		// add spaces after the last character of the cell
		lines = lines.map((row): LineChange => {
			const columnBoundaries = getColumnBoundaries(row)
			const startIndex = columnBoundaries[i]
			const endIndex = columnBoundaries[i + 1] + 1
			const rowChars = row.insert.split('')
			if (startIndex < basedCursorPos) {
				const currentSpaces = getSpacesAfterLastChar(row, startIndex, endIndex)
				const spacesToAdd = widestCell.insert.length - row.insert.slice(startIndex, endIndex).length
				if (spacesToAdd > 0) {
					rowChars.splice(
						endIndex - 1 - currentSpaces.length,
						currentSpaces.length,
						currentSpaces + ' '.repeat(spacesToAdd)
					)
				} else if (spacesToAdd < 0) {
					rowChars.splice(
						endIndex - 1 - currentSpaces.length,
						currentSpaces.length,
						currentSpaces.slice(0, spacesToAdd)
					)
				}
			}

			return { ...row, insert: rowChars.join('') }
		})
	}

	return lines
}

const getNewCursorPosition = (lines: LineChange[], range: SelectionRange, state: EditorState) => {
	let lengthChangeBefore = lines[0].from

	for (const line of lines) {
		const isAllBefore = line.to <= range.from
		const isPartiallyBefore = line.from <= range.from && line.to >= range.from
		if (isAllBefore) {
			lengthChangeBefore += line.insert.length + 1
		} else if (isPartiallyBefore) {
			const originalLine = state.doc.lineAt(line.from)
			const beforeCursor = originalLine.text.slice(0, range.from - originalLine.from)
			lengthChangeBefore += beforeCursor.length
		}
	}

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
		let lines = getTableLines(update.state, range)

		if (lines.length < 1) return { range }
		lines = formatTableCell(lines, update)

		lines = formatColumnWidth(lines, update)

		const newCursorPos = getNewCursorPosition(lines, range, update.state)

		resized = true
		return { range: EditorSelection.cursor(newCursorPos), changes: lines }
	})

	if (!changes.changes.empty) {
		update.view.dispatch(changes)
	}
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
	const checkBoxPattern = /^\s*(- \[(x| )\]) /i
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

const selectWithInEmphasis = (range: SelectionRange, state: EditorState): SelectionRange => {
	let from = range.from
	let to = range.to
	const line = state.doc.lineAt(range.from)
	const emphasis = ['*', '_', '~', '`', '"', "'"]
	let emphasisOpening = ''
	let emphasisClosing = ''

	while (from > line.from) {
		const char = line.text[from - line.from - 1]
		if (emphasis.includes(char)) {
			emphasisOpening = char
			break
		}
		from--
	}

	while (to < line.to) {
		const char = line.text[to - line.from]
		if (emphasis.includes(char) && char === emphasisOpening) {
			emphasisClosing = char
			break
		}
		to++
	}

	if ((from === line.from && to === line.to) || !emphasisClosing) return range
	return EditorSelection.range(from, to)
}

const selectEmphasisBoundary = (range: SelectionRange, state: EditorState): SelectionRange => {
	let from = range.from
	let to = range.to
	const line = state.doc.lineAt(range.from)
	const emphasis = ['*', '_', '~', '`', '"', "'"]
	let emphasisOpening = ''
	let emphasisClosing = ''

	while (from > line.from) {
		const char = line.text[from - line.from - 1]
		const prevChar = line.text[from - line.from - 2]
		if (emphasis.includes(char)) {
			emphasisOpening = char
			if (emphasis.includes(prevChar) && char === prevChar) {
				from -= 2
				break
			}
			from--
			break
		}
		from--
	}

	while (to < line.to) {
		const char = line.text[to - line.from]
		const nextChar = line.text[to - line.from + 1]
		if (emphasis.includes(char) && char === emphasisOpening) {
			emphasisClosing = char
			if (emphasis.includes(nextChar) && char === nextChar) {
				to += 2
				break
			}
			to++
			break
		}
		to++
	}

	if ((from === line.from && to === line.to) || !emphasisClosing) {
		return range
	}
	return EditorSelection.range(from, to)
}

const isListItem = (value: string) => {
	const listItemPattern = /^\s*(-|\*|\+|\d+\.) /i
	return listItemPattern.test(value)
}

const isMultipleSentencesSelected = (start: number, end: number, line: Line) => {
	const sentenceRegex = /.+?[.!?]\s+.+?/g
	return line.text.slice(start, end).match(sentenceRegex) !== null
}

const selectFullSentence = (range: SelectionRange, state: EditorState): SelectionRange => {
	let from = range.from
	let to = range.to
	const line = state.doc.lineAt(range.from)

	if (
		line.text.length === 0 ||
		isMultipleSentencesSelected(from, to, line) ||
		isListItem(line.text.slice(from - line.from, to - line.from))
	) {
		return range
	}

	const punctuation = /[.!?]/
	const isLineCheckbox = isCheckBox(line.text)

	while (from > line.from) {
		const pos = from - line.from
		const char = line.text[pos - 1]
		const includesListItem = isListItem(line.text.slice(pos - 2, pos))
		const includesCheckBox = isCheckBox(line.text.slice(pos - 6, pos))

		if (
			(punctuation.test(char + line.text[pos - 1]) && !includesListItem) ||
			(includesListItem && !isLineCheckbox) ||
			includesCheckBox
		) {
			break
		}
		from--
	}

	while (to < line.to) {
		const char = line.text[to - line.from]
		if (punctuation.test(char)) break
		to++
	}

	return EditorSelection.range(from, to)
}

const selectListItemBoundary = (range: SelectionRange, state: EditorState): SelectionRange => {
	const line = state.doc.lineAt(range.from)
	const isLineListItem = isListItem(line.text)

	if (line.text.length === 0 || !isLineListItem) return range

	const listItemPattern = /^\s*(-|\*|\+|\d+\.) /i
	const startIndex = line.text.indexOf(listItemPattern.exec(line.text)?.[1] ?? '- ')

	if (startIndex === -1 || line.from + startIndex === range.from) return range
	return EditorSelection.range(line.from + startIndex, line.to)
}

const isListItemParent = (line: Line) => {
	const listItemPattern = /^\s*(-|\*|\+|\d+\.) /i
	const listType = listItemPattern.exec(line.text)?.[1] ?? '- '
	return line.text.startsWith(listType)
}

const selectListItemSection = (range: SelectionRange, state: EditorState): SelectionRange => {
	let from = range.from
	let to = range.to
	const line = state.doc.lineAt(range.from)
	const isLineListItem = isListItem(line.text)

	if (line.text.length === 0 || !isLineListItem) return range

	const isParent = isListItemParent(line)

	if (!isParent) {
		while (from > 0) {
			const prevLine = state.doc.lineAt(from - 1)
			if (!isListItem(prevLine.text)) break
			if (isListItemParent(prevLine)) {
				from = prevLine.from
				break
			}
			from--
		}
	}

	while (to < state.doc.length) {
		const nextLine = state.doc.lineAt(to + 1)
		if (isListItemParent(nextLine) || !isListItem(nextLine.text)) {
			to = nextLine.from - 1
			break
		}
		to++
	}

	return EditorSelection.range(from, to)
}

const selectParagraphBoundary = (range: SelectionRange, state: EditorState): SelectionRange => {
	let tree = syntaxTree(state),
		stack = tree.resolveStack(range.from, 1)

	for (let cur: typeof stack | null = stack; cur; cur = cur.next) {
		let { node } = cur
		if (
			((node.from < range.from && node.to >= range.to) ||
				(node.to > range.to && node.from <= range.from)) &&
			cur.next
		)
			return EditorSelection.range(node.to, node.from)
	}

	return range
}

const selectSectionBoundary = (range: SelectionRange, state: EditorState): SelectionRange => {
	const { number } = state.doc.lineAt(range.from)
	const headerPattern = /^(#{1,6})\s+/
	let newRange = { from: range.from, to: range.to }

	for (let i = number; i > 0; i--) {
		const prevLine = state.doc.line(i)
		if (headerPattern.test(prevLine.text)) {
			newRange.from = prevLine.from
			break
		}
	}

	for (let i = number; i <= state.doc.lines; i++) {
		const nextLine = state.doc.line(i)
		if (i === state.doc.lines) {
			newRange.to = state.doc.length
			break
		}
		if (headerPattern.test(nextLine.text) && i !== number) {
			newRange.to = nextLine.from - 1
			break
		}
	}

	return EditorSelection.range(newRange.from, newRange.to)
}

const updateSel = (sel: EditorSelection, by: (range: SelectionRange) => SelectionRange) => {
	return EditorSelection.create(sel.ranges.map(by), sel.mainIndex)
}

const setSel = (
	state: EditorState,
	selection: EditorSelection | { anchor: number; head?: number }
) => {
	return state.update({ selection, scrollIntoView: true, userEvent: 'select' })
}

const gt = (rangeA: SelectionRange, rangeB: SelectionRange) => {
	return (
		(rangeA.from < rangeB.from && rangeA.to >= rangeB.to) ||
		(rangeA.to > rangeB.to && rangeA.from <= rangeB.from)
	)
}

let rangeHistory: EditorSelection[] = []

/**
 * Extend selection range to the next parent
 */
export const extendSelectionToParent = ({ state, dispatch }: EditorView) => {
	const selection = updateSel(state.selection, (range) => {
		let newRange = range

		if (range.from === range.to) {
			rangeHistory = [state.selection]
			newRange = selectWordBoundary(range, state)
			if (gt(newRange, range)) return newRange
		}

		newRange = selectWithInEmphasis(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectEmphasisBoundary(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectFullSentence(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectListItemBoundary(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectListItemSection(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectParagraphBoundary(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = selectSectionBoundary(newRange, state)
		if (gt(newRange, range)) return newRange

		newRange = EditorSelection.range(0, state.doc.length)
		if (gt(newRange, range)) return newRange

		return range
	})
	if (selection.eq(state.selection)) return false
	rangeHistory.push(selection)
	dispatch(setSel(state, selection))
	return true
}

/**
 * Contract selection range to the extended elements child
 */
export const contractSelectionToChild = ({ state, dispatch }: EditorView) => {
	if (rangeHistory.length === 0) return false

	// Check if the last range does not match the current selection, meaning the cursor has moved.
	if (!rangeHistory[rangeHistory.length - 1].eq(state.selection)) {
		rangeHistory = []
		return false
	}

	rangeHistory = rangeHistory.slice(0, rangeHistory.length - 1)
	const selection = rangeHistory[rangeHistory.length - 1]
	dispatch(setSel(state, selection))
	return true
}

/**
 * Insert new blank line above cursor position
 */
export const insertBlankLineAbove = ({ state, dispatch }: EditorView) => {
	const changes = state.changeByRange((range) => {
		const line = state.doc.lineAt(range.from)
		const from = line.from
		const to = line.from
		const indent = countColumn(/^\s*/.exec(state.doc.lineAt(from).text)![0], state.tabSize)

		return {
			changes: { from, to, insert: `${indentString(state, indent)}\n` },
			range: EditorSelection.cursor(from + indent)
		}
	})

	dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }))
	return true
}

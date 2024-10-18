import {
	countColumn,
	EditorSelection,
	EditorState,
	Text,
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

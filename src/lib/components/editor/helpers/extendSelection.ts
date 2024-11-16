import { EditorSelection, EditorState, type Line, type SelectionRange } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { selectWordBoundary } from './emphasis'
import { isCheckBox } from './insertLines'

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
	return state.update({ selection, scrollIntoView: false, userEvent: 'select' })
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

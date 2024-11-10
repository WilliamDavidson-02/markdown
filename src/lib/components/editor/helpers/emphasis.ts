import {
	EditorSelection,
	EditorState,
	Transaction,
	type ChangeSpec,
	type SelectionRange
} from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export const isBold = (value: string) => {
	return value.startsWith('**') && value.endsWith('**')
}

export const isItalic = (value: string) => {
	return value.startsWith('*') && value.endsWith('*')
}

export const selectWordBoundary = (range: SelectionRange, state: EditorState) => {
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

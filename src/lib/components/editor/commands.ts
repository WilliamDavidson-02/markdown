import { defaultKeymap, insertBlankLine } from '@codemirror/commands'
import {
	EditorSelection,
	EditorState,
	Line,
	SelectionRange,
	Transaction,
	type ChangeSpec
} from '@codemirror/state'
import type { EditorView, KeyBinding } from '@codemirror/view'

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

const toggleBold = (editor: EditorView) => {
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

const toggleItalic = (editor: EditorView) => {
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

const toggleCheckbox = (line: Line, range: SelectionRange) => {
	const startIndex = line.text.indexOf('- [')
	const isChecked = line.text.toLowerCase().includes('- [x]')

	const checkbox = isChecked ? '- [ ]' : '- [x]'

	return {
		from: line.from + startIndex,
		to: line.from + startIndex + checkbox.length,
		insert: checkbox
	}
}

const handleInsertBlankLine = (editor: EditorView) => {
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
/**
 * Custom keymaps
 */
export const customKeymaps: KeyBinding[] = [
	{
		key: 'Mod-b',
		run: toggleBold,
		preventDefault: true
	},
	{
		key: 'Mod-i',
		run: toggleItalic,
		preventDefault: true
	}
]

/**
 * Default codemirror keymaps, remapped with custom function and new keys
 */
export const reMappedKeymap = defaultKeymap.map((keymap: KeyBinding) => {
	// Replace default keymap Mod-i, so custom Mod-i can be used
	if (keymap.run?.name === 'selectParentSyntax') {
		keymap.key = 'Shift-Mod-i'
	}

	// Default Mod-Enter keymap.run.name is empty, to find it we compare the function.
	if (keymap.run === insertBlankLine) {
		keymap.run = handleInsertBlankLine
	}

	return keymap
})

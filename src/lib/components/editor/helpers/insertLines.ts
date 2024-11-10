import { insertBlankLine } from '@codemirror/commands'
import { indentString } from '@codemirror/language'
import { countColumn, EditorSelection, Line, Transaction, type ChangeSpec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

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

export const isCheckBox = (value: string) => {
	const checkBoxPattern = /^\s*(- \[(x| )\]) /i
	return checkBoxPattern.test(value)
}

export const toggleCheckbox = (line: Line) => {
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
				changes.push(toggleCheckbox(line))
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

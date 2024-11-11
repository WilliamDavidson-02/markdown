import { indentString } from '@codemirror/language'
import { countColumn, EditorSelection, Line, Transaction, type ChangeSpec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { getTableLines, tableRegex } from './tables'

const createBlankTableLine = (delimiter: string) => {
	const delChars = delimiter.split('')
	return (
		delChars
			.map((c, i) => {
				if (c === '|') return '|'
				return ' '
			})
			.join('') + '\n'
	)
}

export const insertNewBlankLine = (
	{ state, dispatch }: EditorView,
	direction: 'above' | 'below' = 'above'
) => {
	const changes = state.changeByRange((range) => {
		const line = state.doc.lineAt(range.from)
		const from = direction === 'above' ? line.from : line.to + 1
		const to = direction === 'above' ? line.from : line.to + 1
		const indent = countColumn(/^\s*/.exec(state.doc.lineAt(from).text)![0], state.tabSize)
		let toInsert = '\n'

		const tableLines = getTableLines(state, range)

		if (tableLines.length > 0) {
			const delimiter = tableLines[1]
			const { number } = state.doc.lineAt(delimiter.from)
			if (
				tableRegex.delimiter.test(delimiter.insert) &&
				((direction === 'above' && number < line.number) ||
					(direction === 'below' && number <= line.number))
			) {
				toInsert = createBlankTableLine(delimiter.insert)
			}
		}

		return {
			changes: {
				from,
				to,
				insert: `${indentString(state, indent)}${toInsert}`
			},
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
		return insertNewBlankLine(editor, 'below')
	}

	editor.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})

	return true
}

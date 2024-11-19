import { EditorSelection, Transaction, type ChangeSpec } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { CompletionContext, type Completion } from '@codemirror/autocomplete'
import { languages } from '@codemirror/language-data'

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

const applyTable = (view: EditorView, completion: Completion) => {
	const changes = view.state.changeByRange((range) => {
		const line = view.state.doc.lineAt(range.from)
		const insert = `| Column  | Column  | Column  |\n| ------- | ------- | ------- |\n| Data    | Data    | Data    |\n| Data    | Data    | Data    |`

		return {
			range: EditorSelection.cursor(line.from + insert.length),
			changes: [{ from: line.from, to: line.to, insert }]
		}
	})

	if (changes.changes.empty) return

	view.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})
}

const applyListItem = (view: EditorView) => {
	const changes = view.state.changeByRange((range) => {
		const line = view.state.doc.lineAt(range.from)
		const insert = '- '

		return {
			range: EditorSelection.cursor(line.from + insert.length),
			changes: [{ from: line.from, to: line.to, insert }]
		}
	})

	if (changes.changes.empty) return

	view.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})
}

const applyCheckList = (view: EditorView) => {
	const changes = view.state.changeByRange((range) => {
		const line = view.state.doc.lineAt(range.from)
		const insert = '- [ ] '

		return {
			range: EditorSelection.cursor(line.from + insert.length),
			changes: [{ from: line.from, to: line.to, insert }]
		}
	})

	if (changes.changes.empty) return

	view.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})
}

const applyH1 = (view: EditorView, heading: number) => {
	const changes = view.state.changeByRange((range) => {
		const line = view.state.doc.lineAt(range.from)
		const insert = '#'.repeat(heading) + ' '

		return {
			range: EditorSelection.cursor(line.from + insert.length),
			changes: [{ from: line.from, to: line.to, insert }]
		}
	})

	if (changes.changes.empty) return

	view.dispatch(changes, {
		scrollIntoView: true,
		annotations: Transaction.userEvent.of('input')
	})
}

export const slashCompletions = (context: CompletionContext) => {
	let word = context.matchBefore(/\/.*/)
	if (word?.from === word?.to && !context.explicit) return null

	const completions: Completion[] = [
		{
			label: '/table',
			displayLabel: 'Table',
			apply: applyTable
		},
		{
			label: '/list',
			displayLabel: 'List',
			apply: applyListItem,
			type: 'text'
		},
		{
			label: '/check',
			displayLabel: 'Check List',
			apply: applyCheckList,
			type: 'text'
		},
		{
			label: '/heading1',
			displayLabel: 'Heading 1',
			apply: (view) => applyH1(view, 1),
			type: 'text'
		},
		{
			label: '/heading2',
			displayLabel: 'Heading 2',
			apply: (view) => applyH1(view, 2),
			type: 'text'
		},
		{
			label: '/heading3',
			displayLabel: 'Heading 3',
			apply: (view) => applyH1(view, 3),
			type: 'text'
		},
		{
			label: '/heading4',
			displayLabel: 'Heading 4',
			apply: (view) => applyH1(view, 4),
			type: 'text'
		},
		{
			label: '/heading5',
			displayLabel: 'Heading 5',
			apply: (view) => applyH1(view, 5),
			type: 'text'
		},
		{
			label: '/heading6',
			displayLabel: 'Heading 6',
			apply: (view) => applyH1(view, 6),
			type: 'text'
		}
	]

	return {
		from: word?.from,
		options: completions
	}
}

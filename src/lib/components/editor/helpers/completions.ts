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

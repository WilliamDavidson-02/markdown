import { EditorView } from '@codemirror/view'

export const theme = EditorView.theme({
	'&': {
		height: '100%',
		maxHeight: '100%',
		backgroundColor: 'var(--secondary)'
	}
})

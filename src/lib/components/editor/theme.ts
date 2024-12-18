import { HighlightStyle } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { defaultEditorSettings } from '../settings/defaultSettings'

const colors = {
	base: 'var(--base)',
	secondary: 'var(--secondary)',
	secondaryDk: 'var(--secondary-dk)',
	foregroundLi: 'var(--foreground-li)',
	foregroundMd: 'var(--foreground-md)',
	foregroundDk: 'var(--foreground-dk)',
	interactive: 'var(--interactive)',
	interactiveActive: 'var(--interactive-active)',
	danger: 'var(--danger)',
	dangerActive: 'var(--danger-active)',
	markdownYellow: 'var(--markdown-yellow)',
	markdownGreen: 'var(--markdown-green)',
	markdownPurple: 'var(--markdown-purple)',
	markdownPink: 'var(--markdown-pink)',
	markdownBlue: 'var(--markdown-blue)'
}

export const theme = (editorSettings: typeof defaultEditorSettings) => {
	return EditorView.theme({
		'&': {
			maxHeight: 'inherit',
			height: 'inherit',
			backgroundColor: colors.secondary,
			color: colors.foregroundDk
		},
		'.cm-content': {
			caretColor: colors.interactive,
			fontFamily: 'Roboto Mono, Monospace',
			fontSize: `${editorSettings.fontSize}px`,
			whiteSpace: 'pre-wrap',
			marginBottom: '100%'
		},
		'.cm-scroller': {
			overflowY: 'scroll'
		},
		'.cm-scroller > .cm-content': {
			tabSize: `${editorSettings.tabSize} !important`
		},

		'.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.interactive },
		'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
			{
				backgroundColor: colors.secondaryDk
			},

		'.cm-panels': { backgroundColor: colors.secondary, color: colors.foregroundDk },
		'.cm-panels.cm-panels-top': { borderBottom: `2px solid ${colors.secondaryDk}` },
		'.cm-panels.cm-panels-bottom': { borderTop: `2px solid ${colors.secondaryDk}` },

		'.cm-searchMatch': {
			backgroundColor: '#72a1ff59',
			outline: '1px solid #457dff'
		},
		'.cm-searchMatch.cm-searchMatch-selected': {
			backgroundColor: '#6199ff2f'
		},

		'.cm-activeLine': { backgroundColor: '#6699ff0b' },
		'.cm-selectionMatch': { backgroundColor: '#aafe661a' },

		'&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
			backgroundColor: '#bad0f847'
		},

		'.cm-activeLineGutter': {
			backgroundColor: colors.interactive
		},

		'.cm-foldPlaceholder': {
			backgroundColor: 'transparent',
			border: 'none',
			color: '#ddd'
		},

		'.cm-tooltip': {
			border: '1px solid var(--secondary-dk)',
			borderRadius: '4px',
			padding: '4px',
			boxShadow: 'var(--shadow-overlay)',
			backgroundColor: colors.base,
			color: colors.foregroundDk,
			fontSize: '1rem'
		},
		'.cm-tooltip .cm-tooltip-arrow:before': {
			borderTopColor: 'transparent',
			borderBottomColor: 'transparent'
		},
		'.cm-tooltip .cm-tooltip-arrow:after': {
			borderTopColor: colors.secondary,
			borderBottomColor: colors.secondary
		},
		'.cm-tooltip-autocomplete': {
			'& > ul > li[aria-selected]': {
				backgroundColor: colors.interactive,
				color: colors.foregroundDk,
				borderRadius: '4px'
			},
			'& > ul > li': {
				margin: '4px 0 !important',
				padding: '4px !important'
			}
		}
	})
}

export const themeHighlightStyle = HighlightStyle.define([
	{ tag: t.strong, fontWeight: 'bold', color: colors.markdownYellow },
	{ tag: t.emphasis, fontStyle: 'italic', color: colors.markdownGreen },
	{ tag: t.strikethrough, textDecoration: 'line-through', color: colors.markdownPink },

	{ tag: t.url, color: colors.markdownBlue },

	{
		tag: t.monospace,
		color: colors.markdownPink,
		backgroundColor: colors.base,
		borderRadius: '4px',
		outline: `1px solid ${colors.foregroundLi}`
	},
	{
		tag: [t.keyword, t.moduleKeyword, t.controlKeyword, t.definitionKeyword],
		color: colors.markdownGreen
	},

	{ tag: t.processingInstruction, opacity: 0.5 },

	{ tag: t.quote, color: colors.foregroundMd, fontStyle: 'italic' },

	{ tag: [t.meta, t.comment], color: colors.foregroundMd },
	{ tag: t.atom, color: colors.foregroundDk },
	{ tag: t.tagName, color: colors.markdownBlue },
	{ tag: [t.attributeName, t.variableName], color: colors.markdownPurple },
	{
		tag: [t.string, t.propertyName, t.attributeValue, t.bracket, t.punctuation],
		color: colors.markdownYellow
	},
	{ tag: t.string, color: colors.markdownPink }
])

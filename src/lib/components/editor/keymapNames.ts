import * as c from '@codemirror/commands'
import {
	contractSelectionToChild,
	extendSelectionToParent,
	handleInsertBlankLine,
	handleInsertBlankLineAbove,
	toggleBold,
	toggleItalic
} from './helpers'
import type { Command } from '@codemirror/view'

export const keymapNames = [
	{ name: 'cursorSyntaxLeft', func: c.cursorSyntaxLeft },
	{ name: 'cursorSyntaxRight', func: c.cursorSyntaxRight },
	{ name: 'moveLineUp', func: c.moveLineUp },
	{ name: 'copyLineUp', func: c.copyLineUp },
	{ name: 'moveLineDown', func: c.moveLineDown },
	{ name: 'copyLineDown', func: c.copyLineDown },
	{ name: 'simplifySelection', func: c.simplifySelection },
	{ name: 'handleInsertBlankLine', func: handleInsertBlankLine },
	{ name: 'selectLine', func: c.selectLine },
	{ name: 'selectParentSyntax', func: c.selectParentSyntax },
	{ name: 'indentLess', func: c.indentLess },
	{ name: 'indentMore', func: c.indentMore },
	{ name: 'indentSelection', func: c.indentSelection },
	{ name: 'deleteLine', func: c.deleteLine },
	{ name: 'cursorMatchingBracket', func: c.cursorMatchingBracket },
	{ name: 'toggleComment', func: c.toggleComment },
	{ name: 'toggleTabFocusMode', func: c.toggleTabFocusMode },
	{ name: 'cursorCharLeft', func: c.cursorCharLeft },
	{ name: 'cursorGroupLeft', func: c.cursorGroupLeft },
	{ name: 'cursorLineBoundaryLeft', func: c.cursorLineBoundaryLeft },
	{ name: 'cursorCharRight', func: c.cursorCharRight },
	{ name: 'cursorGroupRight', func: c.cursorGroupRight },
	{ name: 'cursorLineBoundaryRight', func: c.cursorLineBoundaryRight },
	{ name: 'cursorLineUp', func: c.cursorLineUp },
	{ name: 'cursorDocStart', func: c.cursorDocStart },
	{ name: 'cursorPageUp', func: c.cursorPageUp },
	{ name: 'cursorLineDown', func: c.cursorLineDown },
	{ name: 'cursorDocEnd', func: c.cursorDocEnd },
	{ name: 'cursorPageDown', func: c.cursorPageDown },
	{ name: 'cursorPageUp', func: c.cursorPageUp },
	{ name: 'cursorPageDown', func: c.cursorPageDown },
	{ name: 'cursorLineBoundaryBackward', func: c.cursorLineBoundaryBackward },
	{ name: 'cursorDocStart', func: c.cursorDocStart },
	{ name: 'cursorLineBoundaryForward', func: c.cursorLineBoundaryForward },
	{ name: 'cursorDocEnd', func: c.cursorDocEnd },
	{ name: 'selectAll', func: c.selectAll },
	{ name: 'deleteCharBackward', func: c.deleteCharBackward },
	{ name: 'deleteCharForward', func: c.deleteCharForward },
	{ name: 'deleteGroupBackward', func: c.deleteGroupBackward },
	{ name: 'deleteGroupForward', func: c.deleteGroupForward },
	{ name: 'deleteLineBoundaryBackward', func: c.deleteLineBoundaryBackward },
	{ name: 'deleteLineBoundaryForward', func: c.deleteLineBoundaryForward },
	{ name: 'cursorCharLeft', func: c.cursorCharLeft },
	{ name: 'cursorCharRight', func: c.cursorCharRight },
	{ name: 'cursorLineUp', func: c.cursorLineUp },
	{ name: 'cursorLineDown', func: c.cursorLineDown },
	{ name: 'cursorLineStart', func: c.cursorLineStart },
	{ name: 'cursorLineEnd', func: c.cursorLineEnd },
	{ name: 'deleteCharForward', func: c.deleteCharForward },
	{ name: 'deleteCharBackward', func: c.deleteCharBackward },
	{ name: 'deleteToLineEnd', func: c.deleteToLineEnd },
	{ name: 'deleteGroupBackward', func: c.deleteGroupBackward },
	{ name: 'splitLine', func: c.splitLine },
	{ name: 'transposeChars', func: c.transposeChars },
	{ name: 'cursorPageDown', func: c.cursorPageDown },
	{ name: 'toggleBold', func: toggleBold },
	{ name: 'toggleItalic', func: toggleItalic },
	{ name: 'extendSelectionToParent', func: extendSelectionToParent },
	{ name: 'contractSelectionToChild', func: contractSelectionToChild },
	{ name: 'insertNewBlankLineAbove', func: handleInsertBlankLineAbove }
]

export const getKeymapName = (run: Command | undefined) => {
	return keymapNames.find((name) => name.func === run)?.name
}

export const formatKeymapName = (name: string) => {
	const lowerName = name
		.split(/(?=[A-Z])/)
		.join(' ')
		.toLowerCase()
	const firstChar = lowerName.charAt(0).toUpperCase()
	return firstChar + lowerName.slice(1)
}

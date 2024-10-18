import { defaultKeymap, insertBlankLine } from '@codemirror/commands'
import {
	contractSelectionToChild,
	extendSelectionToParent,
	handleInsertBlankLine,
	insertBlankLineAbove,
	toggleBold,
	toggleItalic
} from './assistance'
import type { KeyBinding } from '@codemirror/view'

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
	},
	{
		key: 'Ctrl-Alt-ArrowUp',
		run: extendSelectionToParent,
		preventDefault: true
	},
	{
		key: 'Ctrl-Alt-ArrowDown',
		run: contractSelectionToChild,
		preventDefault: true
	},
	{
		key: 'Mod-Shift-Enter',
		run: insertBlankLineAbove,
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

import { defaultKeymap, insertBlankLine, selectParentSyntax } from '@codemirror/commands'
import type { KeyBinding } from '@codemirror/view'
import {
	contractSelectionToChild,
	extendSelectionToParent,
	handleInsertBlankLine,
	handleInsertBlankLineAbove,
	toggleBold,
	toggleItalic
} from './helpers'

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
		run: handleInsertBlankLineAbove,
		preventDefault: true
	}
]

/**
 * Default codemirror keymaps, remapped with custom function and new keys
 */
export const reMappedKeymap = defaultKeymap.map((keymap: KeyBinding) => {
	// Replace default keymap Mod-i, so custom Mod-i can be used
	if (keymap.run === selectParentSyntax) {
		keymap.key = 'Shift-Mod-i'
	}

	// Default Mod-Enter keymap.run.name is empty, to find it we compare the function.
	if (keymap.run === insertBlankLine) {
		keymap.run = handleInsertBlankLine
	}

	return keymap
})

export const editorKeymaps = (replacedKeymaps: { key: string; name: string }[] = []) => {
	const initialKeymaps = [...reMappedKeymap, ...customKeymaps]

	return initialKeymaps.map((keymap) => {
		const toReplaceKeyMap = replacedKeymaps.find((custom) => custom.name === keymap.run?.name)
		return toReplaceKeyMap ? { ...keymap, key: toReplaceKeyMap.key } : keymap
	})
}

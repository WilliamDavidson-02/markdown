<script lang="ts">
	import { Command, CommandInput, CommandItem, CommandList } from '$lib/components/command'
	import { keymapNames } from '$lib/components/editor/keymapNames'
	import { getSettings } from '../settingsContext'
	import ShortcutKeysItem from './ShortcutKeysItem.svelte'

	const settings = getSettings()
	// run name is what identifies the keymap in db, so we filter for those
	$: keybindings =
		$settings?.editorKeymaps
			.filter((keymap) => keymap.run?.name)
			.map((k) => ({ ...k, key: k.key ?? '' })) ?? []

	const getKeymapName = (runName: string) => {
		const keymapName = keymapNames.find((name) => name.nameMini === runName)
		return keymapName ? keymapName.name : runName
	}
</script>

<div>
	<Command class="keybindings-command">
		<CommandInput placeholder="Search keybindings" />
		<CommandList class="keybindings-list">
			{#each keybindings as keybinding}
				<CommandItem value={`${getKeymapName(keybinding.run?.name ?? '')} ${keybinding.key}`}>
					<ShortcutKeysItem {keybinding} />
				</CommandItem>
			{/each}
		</CommandList>
	</Command>
</div>

<style>
	div {
		height: 100%;
	}

	:global(.keybindings-command) {
		max-height: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}

	:global(.keybindings-list) {
		max-height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	:global(.keybindings-list > div) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>

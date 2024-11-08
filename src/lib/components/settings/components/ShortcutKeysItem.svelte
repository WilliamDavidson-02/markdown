<script lang="ts">
	import type { KeyBinding } from '@codemirror/view'
	import ShortcutKeybinding from './ShortcutKeybinding.svelte'

	export let keybinding: KeyBinding

	const formatName = (name: string) => {
		const lowerName = name
			.split(/(?=[A-Z])/)
			.join(' ')
			.toLowerCase()
		const firstChar = lowerName.charAt(0).toUpperCase()
		return firstChar + lowerName.slice(1)
	}
</script>

<div class="keybinding-item">
	<span>{formatName(keybinding.run?.name ?? '')}</span>
	<ShortcutKeybinding keybinding={keybinding.key ?? ''} />
</div>

<style>
	.keybinding-item {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--space-base);
		padding: var(--space-sm) var(--space-base);
		cursor: pointer;
		background-color: var(--secondary);
		border: 1px solid var(--secondary-dk);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		height: 48px;
		flex-shrink: 0;
	}

	span {
		color: var(--foreground-dk-muted);
		font-size: 1rem;
		line-height: 1.2rem;
	}

	.keybinding-item:active {
		background-color: var(--secondary-dk);
	}

	@media (pointer: fine) {
		.keybinding-item:hover {
			background-color: var(--secondary-dk);
		}
	}
</style>

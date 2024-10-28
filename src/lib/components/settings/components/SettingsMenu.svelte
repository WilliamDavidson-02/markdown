<script lang="ts">
	import { Button } from '$lib/components/button'
	import { User, PencilIcon, Settings2, Command, Cable } from 'lucide-svelte'
	import type { SettingsItem, SettingsSelected } from '../types'

	export let selected: SettingsSelected

	const list: SettingsItem[] = [
		{ icon: User, label: 'Account' },
		{ icon: PencilIcon, label: 'Editor' },
		{ icon: Settings2, label: 'General' },
		{ icon: Command, label: 'Shortcut keys' },
		{ icon: Cable, label: 'Connections' }
	]
</script>

<aside>
	{#each list as item}
		<Button
			variant="ghost"
			class="settings-item-btn"
			data-selected={selected === item.label}
			on:click={() => (selected = item.label)}
		>
			<svelte:component this={item.icon} size={20} class="settings-item-icon" />
			<span>{item.label}</span>
		</Button>
	{/each}
</aside>

<style>
	aside {
		flex-shrink: 0;
		width: 250px;
		height: 100%;
		background-color: var(--secondary);
		border-right: 1px solid var(--secondary-dk);
		padding: var(--space-base);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	span {
		width: 100%;
		text-align: left;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 1rem;
		font-weight: 500;
		line-height: 24px;
	}

	:global(.settings-item-btn[data-selected='true']),
	:global(.settings-item-btn:active),
	:global(.settings-item-btn:focus) {
		background-color: var(--secondary-dk) !important;
	}

	:global(.settings-item-icon) {
		color: var(--foreground-md);
	}

	@media (pointer: fine) {
		:global(.settings-item-btn:hover) {
			background-color: var(--secondary-dk) !important;
		}
	}
</style>

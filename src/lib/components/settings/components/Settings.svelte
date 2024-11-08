<script lang="ts">
	import { Dialog } from '$lib/components/dialog'
	import SettingsMenu from './SettingsMenu.svelte'
	import type { SettingsSelected } from '../types'
	import Account from './Account.svelte'
	import SettingsEditor from './SettingsEditor.svelte'
	import ShortcutKeys from './ShortcutKeys.svelte'
	import Connections from './Connections.svelte'

	export let settingsDialog: HTMLDialogElement
	export let selected: SettingsSelected = 'Account'
</script>

<Dialog
	bind:dialog={settingsDialog}
	on:close={() => (selected = 'Account')}
	withClose={false}
	class="settings-dialog"
>
	<div class="settings">
		<SettingsMenu bind:selected />
		<div class="settings-content">
			{#if selected === 'Account'}
				<Account />
			{:else if selected === 'Editor'}
				<SettingsEditor />
			{:else if selected === 'Shortcut keys'}
				<ShortcutKeys />
			{:else if selected === 'Connections'}
				<Connections />
			{/if}
		</div>
	</div>
</Dialog>

<style>
	.settings {
		display: flex;
		height: 100%;
		width: 100%;
	}

	.settings-content {
		width: 100%;
		height: 100%;
		padding: var(--space-base);
	}

	:global(.settings-dialog) {
		max-width: 1024px;
		width: 100%;
		max-height: 700px;
		height: 100%;
	}
</style>

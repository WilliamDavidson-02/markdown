<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Divider } from '$lib/components/divider'
	import { Loader2 } from 'lucide-svelte'
	import AccountItem from './AccountItem.svelte'
	import { getSettings } from '../settingsContext'
	import { goto } from '$app/navigation'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { editorStore } from '$lib/components/editor/editorStore'
	import AccountDelete from './AccountDelete.svelte'
	import AccountPassword from './AccountPassword.svelte'
	import AccountEmail from './AccountEmail.svelte'

	const settings = getSettings()

	let isLoggingOut = false
	let isLoggingOutAll = false

	const logout = async () => {
		try {
			isLoggingOut = true
			const response = await fetch('/sign-out', { method: 'POST' })
			if (response.ok) {
				selectedFile.set(null)
				$editorStore?.dispatch({
					changes: { from: 0, to: $editorStore.state.doc.length, insert: '' }
				})
				await goto('/')
			}
		} catch (error) {
			console.error(error)
		} finally {
			isLoggingOut = false
		}
	}

	const logoutAll = async () => {
		try {
			isLoggingOutAll = true
			await fetch('/sign-out/all', { method: 'POST' })
		} catch (error) {
			console.error(error)
		} finally {
			isLoggingOutAll = false
		}
	}
</script>

<div class="account">
	{#if $settings?.user.email}
		<div class="section">
			<h2>Account security</h2>
			<Divider />
			<AccountEmail />
			<AccountPassword />
		</div>
	{/if}
	<div class="section">
		<h2>Support</h2>
		<Divider />
		<AccountDelete />
	</div>
	<div class="section">
		<h2>Devices</h2>
		<Divider />
		<AccountItem>
			<h3 slot="title">Log out of all devices</h3>
			<p slot="description">
				Log out of all other active sessions on other devices besides this one.
			</p>
			<Button
				slot="action"
				variant="outline"
				disabled={isLoggingOutAll}
				on:click={logoutAll}
				on:keydown={logoutAll}
			>
				{#if isLoggingOutAll}
					<Loader2 size={20} stroke-width={1.5} color="var(--foreground-md)" class="animate-spin" />
				{/if}
				Log out of all devices</Button
			>
		</AccountItem>
		<AccountItem>
			<h3 slot="title">Log out</h3>
			<p slot="description">Log out of this device.</p>
			<Button
				slot="action"
				variant="outline"
				disabled={isLoggingOut}
				on:click={logout}
				on:keydown={logout}
			>
				{#if isLoggingOut}
					<Loader2 size={20} stroke-width={1.5} color="var(--foreground-md)" class="animate-spin" />
				{/if}
				Log out</Button
			>
		</AccountItem>
	</div>
</div>

<style>
	.account {
		display: flex;
		flex-direction: column;
		gap: var(--space-4xl);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	h2 {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--foreground-dk-muted);
	}
</style>

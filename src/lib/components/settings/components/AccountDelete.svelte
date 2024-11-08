<script lang="ts">
	import { Button } from '$lib/components/button'
	import { ChevronRight, Loader2 } from 'lucide-svelte'
	import AccountItem from './AccountItem.svelte'
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { goto } from '$app/navigation'

	let isDeletingUser = false
	let deleteDialog: HTMLDialogElement

	const deleteUser = async () => {
		try {
			isDeletingUser = true
			const res = await fetch('/delete-user', { method: 'DELETE' })
			if (res.ok) await goto('/')
		} catch (error) {
			console.error(error)
		} finally {
			isDeletingUser = false
		}
	}
</script>

<Dialog bind:dialog={deleteDialog} class="delete-account-dialog">
	<DialogHeader>Delete account</DialogHeader>
	<div>
		Permanently delete the account and remove all associated data. This action cannot be undone.
	</div>
	<DialogFooter>
		<Button variant="outline" on:click={() => deleteDialog.close()}>Cancel</Button>
		<Button variant="destructive" on:click={deleteUser}>
			{#if isDeletingUser}
				<Loader2 size={16} class="animate-spin" stroke-width={1.5} />
			{/if}
			Delete account</Button
		>
	</DialogFooter>
</Dialog>

<AccountItem>
	<h3 slot="title" style="color: var(--danger)">Delete account</h3>
	<p slot="description">Permanently delete the account and remove all associated data.</p>
	<Button
		slot="action"
		variant="ghost"
		icon
		on:click={() => deleteDialog.showModal()}
		on:keydown={() => deleteDialog.showModal()}
	>
		<ChevronRight size={20} stroke-width={1.5} color="var(--foreground-md)" />
	</Button>
</AccountItem>

<style>
	:global(.delete-account-dialog) {
		padding: var(--space-base);
		max-width: 500px;
		width: 100vw;
	}

	div {
		margin-top: var(--space-base);
		color: var(--foreground-md);
		font-size: 0.875rem;
	}
</style>

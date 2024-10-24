<script lang="ts">
	import { Dialog, DialogHeader, DialogFooter } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { Loader2 } from 'lucide-svelte'
	import { superForm } from 'sveltekit-superforms'
	import type { PageData } from '../../../../routes/[docId]/$types'
	import { invalidateAll } from '$app/navigation'

	export let folderDialog: HTMLDialogElement
	export let form: PageData['folderForm']

	const {
		form: folderForm,
		submitting,
		errors,
		enhance
	} = superForm(form, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				folderDialog.close()
				await invalidateAll()
			}
		}
	})
</script>

<Dialog bind:dialog={folderDialog}>
	<form method="POST" action="?/folder" use:enhance>
		<DialogHeader>Create new folder</DialogHeader>
		<div class="fields-container">
			<div class="form-field">
				<Label for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					bind:value={$folderForm.name}
					placeholder="Enter a folder name"
					autofocus={folderDialog?.open}
				/>
				<ErrorMessage error={$errors.name} />
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" on:click={() => folderDialog.close()}>Cancel</Button>
			<Button type="submit">
				{#if $submitting}
					<Loader2 class="animate-spin" size={20} />
				{/if}
				Create
			</Button>
		</DialogFooter>
	</form>
</Dialog>

<style>
	.fields-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		margin-top: var(--space-base);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>

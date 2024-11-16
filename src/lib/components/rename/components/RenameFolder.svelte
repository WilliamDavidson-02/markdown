<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { Button } from '$lib/components/button'
	import { DialogFooter } from '$lib/components/dialog'
	import { ErrorMessage } from '$lib/components/error-message'
	import { type Folder } from '$lib/components/file-tree/treeStore'
	import { renameDialog } from '$lib/components/file-tree/treeStore'
	import { Input } from '$lib/components/input'
	import { Label } from '$lib/components/label'
	import { Loader2 } from 'lucide-svelte'
	import { superForm } from 'sveltekit-superforms'

	export let folder: Folder

	const { form, errors, submitting, enhance } = superForm($renameDialog.form!, {
		onSubmit: () => {
			form.update((f) => ({ ...f, type: 'folder', id: folder.id }), { taint: 'untaint-all' })
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				await invalidateAll()
				$renameDialog.element?.close()
			}
		},
		dataType: 'json',
		resetForm: false
	})

	$: form.update((f) => ({ ...f, name: folder.name ?? '' }))

	const handleFolderNameChange = (ev: Event) => {
		const target = ev.target as HTMLInputElement
		const name = target.value.replace(/[\s\/]/g, '')
		form.update((f) => ({ ...f, name }), { taint: 'untaint-all' })
	}
</script>

<form use:enhance action="?/rename" method="POST">
	<div class="form-field">
		<Label for="name">Name</Label>
		<Input
			type="text"
			id="name"
			name="name"
			value={$form.name}
			placeholder="Enter a folder name"
			autofocus={$renameDialog.element?.open}
			on:input={handleFolderNameChange}
		/>
		<ErrorMessage error={$errors.name} />
	</div>
	<DialogFooter>
		<Button
			variant="outline"
			type="button"
			disabled={$submitting}
			on:click={() => $renameDialog.element?.close()}>Cancel</Button
		>
		<Button type="submit" disabled={$submitting}>
			{#if $submitting}
				<Loader2 class="animate-spin" size={20} />
			{/if}
			Rename
		</Button>
	</DialogFooter>
</form>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>

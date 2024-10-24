<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Editor } from '$lib/components/editor'
	import { Nav } from '$lib/components/nav'
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { superForm } from 'sveltekit-superforms'
	import { Loader2 } from 'lucide-svelte'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { FileForm } from '$lib/components/file-form'

	export let data

	let fileDialog: HTMLDialogElement
	let folderDialog: HTMLDialogElement

	const {
		form: folderForm,
		submitting: folderSubmitting,
		errors: folderError,
		enhance: folderEnhance
	} = superForm(data.folderForm)
</script>

<main>
	<FileForm bind:fileDialog form={data.fileForm} />

	<Dialog bind:dialog={folderDialog}>
		<form method="POST" action="?/folder" use:folderEnhance>
			<DialogHeader>Create new folder</DialogHeader>
			<div class="fields-container">
				<div class="form-field">
					<Label for="name">Name</Label>
					<Input type="text" id="name" name="name" bind:value={$folderForm.name} />
					<ErrorMessage error={$folderError.name} />
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" on:click={() => folderDialog.close()}>Cancel</Button>
				<Button type="submit">
					{#if $folderSubmitting}
						<Loader2 class="animate-spin" size={20} />
					{/if}
					Create
				</Button>
			</DialogFooter>
		</form>
	</Dialog>
	<Nav {fileDialog} {folderDialog} />
	<Editor />
</main>

<style>
	main {
		display: flex;
		min-height: 100svh;
	}

	.fields-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>

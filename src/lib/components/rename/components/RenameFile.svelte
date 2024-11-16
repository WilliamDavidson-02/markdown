<script lang="ts">
	import { Button } from '$lib/components/button'
	import { DialogFooter } from '$lib/components/dialog'
	import FileNameField from '$lib/components/file-form/components/FileNameField.svelte'
	import { type File } from '$lib/components/file-tree/treeStore'
	import { renameDialog } from '$lib/components/file-tree/treeStore'
	import { Loader2 } from 'lucide-svelte'
	import { superForm } from 'sveltekit-superforms'
	import { iconColors } from '$lib/fileIcons'
	import { invalidateAll } from '$app/navigation'

	export let file: File
	export let isGithub: boolean = false

	const { form, errors, submitting, enhance } = superForm($renameDialog.form!, {
		onSubmit: () => {
			form.update((f) => ({ ...f, type: 'file', id: file.id, github: isGithub }), {
				taint: 'untaint-all'
			})
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

	$: form.update((f) => ({
		...f,
		name: file.name ?? '',
		icon: file.icon ?? 'File',
		iconColor: file.iconColor ?? iconColors[0].color
	}))
</script>

<form use:enhance action="?/rename" method="POST">
	<FileNameField fileForm={form} autoFocus={$renameDialog.element?.open} {errors} />
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

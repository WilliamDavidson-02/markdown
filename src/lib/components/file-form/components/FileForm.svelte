<script lang="ts">
	import { Dialog, DialogFooter, DialogHeader } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Loader2 } from 'lucide-svelte'
	import { fileIcons } from '$lib/fileIcons'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { superForm } from 'sveltekit-superforms'
	import type { PageData } from '../../../../routes/[docId]/$types'
	import { goto, invalidateAll } from '$app/navigation'

	export let fileDialog: HTMLDialogElement
	export let form: PageData['fileForm']

	let isIconPopoverOpen = false

	const {
		form: fileForm,
		submitting,
		errors,
		enhance
	} = superForm(form, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				fileDialog.close()
				await goto(`/${result.data?.id}`)
				await invalidateAll()
			}
		}
	})

	const handleIconSelect = (iconName: string) => {
		fileForm.update((form) => ({ ...form, icon: iconName }), { taint: 'untaint-all' })
		isIconPopoverOpen = false
	}
</script>

<Dialog bind:dialog={fileDialog}>
	<form method="POST" action="?/file" use:enhance>
		<input type="hidden" name="icon" bind:value={$fileForm.icon} />
		<DialogHeader>Create new file</DialogHeader>
		<div class="fields-container">
			<div class="form-field file-icon">
				<Popover bind:isOpen={isIconPopoverOpen} class="file-icon-popover">
					<PopoverTrigger>
						<Button variant="outline" type="button" icon>
							<svelte:component
								this={fileIcons.find((icon) => icon.name === $fileForm.icon)?.icon}
								size={20}
								strokeWidth={1.5}
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent>
						<Command class="command" label="Search for an icon">
							<CommandInput placeholder="Search..." autofocus />
							<CommandList class="command-list">
								<div class="command-list-items">
									{#each fileIcons as icon}
										<CommandItem
											value={icon.name}
											onSelect={() => handleIconSelect(icon.name)}
											class="command-item"
											title={icon.name}
											data-is-selected={$fileForm.icon === icon.name}
										>
											<svelte:component this={icon.icon} size={20} strokeWidth={1.5} />
										</CommandItem>
									{/each}
								</div>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				<Label class="file-icon-label" for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					class="file-icon-input"
					bind:value={$fileForm.name}
					placeholder="Enter a file name"
				/>
				<ErrorMessage class="file-icon-error" error={$errors.name} />
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" type="button" on:click={() => fileDialog.close()}>Cancel</Button>
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

	.file-icon {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: repeat(3, auto);
		gap: var(--space-sm);
	}

	:global(.file-icon-popover) {
		grid-column: 1;
		grid-row: 2;
	}

	:global(.file-icon-input) {
		grid-column: 2;
		grid-row: 2;
	}

	:global(.file-icon-label) {
		grid-column: 2;
		grid-row: 1;
	}

	:global(.file-icon-error) {
		grid-column: 2;
		grid-row: 3;
	}

	:global(.command-list) {
		max-height: 300px;
		min-width: 300px;
		overflow-y: auto;
		padding: 0 var(--space-sm) var(--space-sm) var(--space-sm);
	}

	:global(.command) {
		background-color: var(--secondary);
		padding: var(--space-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}

	.command-list-items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(26px, 1fr));
		gap: 0.35rem;
	}

	:global(.command-item) {
		aspect-ratio: 1 / 1;
		cursor: pointer;
		transition: background-color 0.2s;
		border-radius: var(--border-radius-sm);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	:global(.command-item:hover:not(:disabled):not([data-is-selected='true'])),
	:global(.command-item[data-selected='true']:not(:disabled):not([data-is-selected='true'])) {
		background-color: var(--secondary-dk);
	}

	:global(.command-item[data-is-selected='true']) {
		background-color: var(--interactive-active);
	}
</style>

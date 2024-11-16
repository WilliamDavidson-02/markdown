<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { fileIcons, iconColors } from '$lib/fileIcons'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import type { SuperFormData, SuperFormErrors } from 'sveltekit-superforms/client'
	import type { fileSchema, renameSchema } from '../../../../routes/[docId]/schemas'
	import type { z } from 'zod'

	export let fileForm: SuperFormData<z.infer<typeof fileSchema> | z.infer<typeof renameSchema>>
	export let errors: SuperFormErrors<z.infer<typeof fileSchema> | z.infer<typeof renameSchema>>
	export let autoFocus = false

	let isIconPopoverOpen = false
	let isIconColorPopoverOpen = false

	const selectIconColor = (color: string) => {
		fileForm.update((form) => ({ ...form, iconColor: color }), { taint: 'untaint-all' })
		isIconColorPopoverOpen = false
	}

	const handleFileNameChange = (ev: Event) => {
		const target = ev.target as HTMLInputElement
		const name = target.value.replace(/[\s\/]/g, '')
		fileForm.update((form) => ({ ...form, name }), { taint: 'untaint-all' })
	}

	const handleIconSelect = (iconName: string) => {
		fileForm.update((form) => ({ ...form, icon: iconName }), { taint: 'untaint-all' })
		isIconPopoverOpen = false
	}
</script>

<div class="form-field file-icon">
	<Popover bind:isOpen={isIconPopoverOpen} class="file-icon-popover">
		<PopoverTrigger>
			<Button variant="outline" type="button" icon>
				<svelte:component
					this={fileIcons.find((icon) => icon.name === $fileForm.icon)?.icon}
					size={20}
					strokeWidth={1.5}
					color={$fileForm.iconColor}
				/>
			</Button>
		</PopoverTrigger>
		<PopoverContent closeOnScroll={false}>
			<Command class="command" label="Search for an icon">
				<div class="command-header">
					<CommandInput placeholder="Search..." autofocus={isIconPopoverOpen} />
					<Popover bind:isOpen={isIconColorPopoverOpen}>
						<PopoverTrigger>
							<Button variant="outline" type="button" icon>
								<div class="icon-color-swatch" style="background-color: {$fileForm.iconColor}" />
							</Button>
							<PopoverContent class="icon-color-popover">
								{#each iconColors as color}
									<Button
										variant="ghost"
										type="button"
										icon
										size="sm"
										on:click={(ev) => {
											ev.stopPropagation()
											ev.preventDefault()
											selectIconColor(color.color)
										}}
									>
										<div
											class="icon-color-swatch"
											style="background-color: {color.color}"
											title={color.name}
										/>
									</Button>
								{/each}
							</PopoverContent>
						</PopoverTrigger>
					</Popover>
				</div>
				<CommandList class="command-list">
					<div class="command-list-items">
						{#each fileIcons as icon}
							<CommandItem
								value={icon.name}
								onSelect={() => handleIconSelect(icon.name)}
								class="command-icon command-item"
								title={icon.name}
								data-is-selected={$fileForm.icon === icon.name}
							>
								<svelte:component
									this={icon.icon}
									size={20}
									strokeWidth={1.5}
									color={$fileForm.iconColor}
								/>
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
		value={$fileForm.name}
		placeholder="Enter a file name"
		autofocus={autoFocus}
		on:input={handleFileNameChange}
	/>
	<ErrorMessage class="file-icon-error" error={$errors.name} />
</div>

<style>
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

	.command-header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-sm);
	}

	.icon-color-swatch {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 100vmax;
	}

	:global(.icon-color-popover) {
		display: grid !important;
		grid-template-columns: repeat(3, 2rem);
		grid-template-rows: repeat(2, 2rem);
		width: fit-content !important;
		min-width: unset !important;
		gap: var(--space-xs);
		background-color: var(--base);
		padding: var(--space-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
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
		cursor: pointer;
		transition: background-color 0.2s;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
	}

	:global(.command-icon) {
		aspect-ratio: 1 / 1;
		justify-content: center;
	}

	:global(.command-item:hover:not(:disabled):not([data-is-selected='true'])),
	:global(.command-item[data-selected='true']:not(:disabled):not([data-is-selected='true'])) {
		background-color: var(--secondary-dk);
	}

	:global(.command-item[data-is-selected='true']) {
		background-color: var(--interactive-active);
	}
</style>

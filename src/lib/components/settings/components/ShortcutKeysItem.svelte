<script lang="ts">
	import type { KeyBinding } from '@codemirror/view'
	import ShortcutKeybinding from './ShortcutKeybinding.svelte'
	import { Dialog } from '$lib/components/dialog'
	import { Button } from '$lib/components/button'
	import { ErrorMessage } from '$lib/components/error-message'
	import { getSettings } from '../settingsContext'
	import { superForm } from 'sveltekit-superforms'
	import { invalidateAll } from '$app/navigation'
	import { Loader2 } from 'lucide-svelte'
	import { editorStore } from '$lib/components/editor/editorStore'
	import { state } from '$lib/components/editor/state'
	import { editorKeymaps } from '$lib/components/editor/commands'
	import { nanoid } from 'nanoid'

	export let keybinding: KeyBinding

	const settings = getSettings()
	const { form, enhance, reset, submitting, submit } = superForm($settings?.keybindingForm!, {
		onSubmit: async ({ cancel }) => {
			// Get ride of double dashes, and remove the last dash if it exists
			const formatedBinding = keyInput
				.split('-')
				.filter((k) => k.length > 0)
				.join('-')
			const existingKeybinding = $settings?.editorKeymaps.find(
				(b) => b.key === formatedBinding && b.run?.name !== keybinding.run?.name
			)

			if (existingKeybinding) {
				keyError = `This keybinding is already used by ${formatName(existingKeybinding.run?.name ?? '')}`
				keyInputElement.focus()
				cancel()
				return
			}

			form.update((form) => ({ ...form, key: formatedBinding, name: keybinding.run?.name ?? '' }))
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				let newKeyMaps =
					$settings?.editorKeymaps.map((keyMap) => ({
						key: (keyMap.run?.name === keybinding.run?.name ? $form.key : keyMap.key) ?? '',
						name: keyMap.run?.name ?? ''
					})) ?? []

				if ($form.reset) {
					newKeyMaps = newKeyMaps.filter((keyMap) => keyMap.name !== keybinding.run?.name)
				}

				$editorStore?.setState(state($settings?.editorSettings, editorKeymaps(newKeyMaps)))
				keybindingDialog.close()
				await invalidateAll()
			}
		},
		dataType: 'json',
		resetForm: false,
		id: nanoid()
	})

	let keybindingDialog: HTMLDialogElement
	let keyInputElement: HTMLInputElement
	let keyInput = keybinding.key ?? ''
	let keyError: string | undefined = undefined

	const formatName = (name: string) => {
		const lowerName = name
			.split(/(?=[A-Z])/)
			.join(' ')
			.toLowerCase()
		const firstChar = lowerName.charAt(0).toUpperCase()
		return firstChar + lowerName.slice(1)
	}

	const handleChange = (ev: KeyboardEvent) => {
		if (keyError) keyError = undefined

		let newKey = ev.key
		if (newKey === ' ') newKey = 'Space'
		if (newKey === 'Meta') newKey = 'Mod'

		const isKeyAlredyUsed = keyInput?.includes(newKey)
		const alredyHasSingleChar =
			newKey.length === 1 && keyInput.split('-').some((key) => key.length === 1)
		if (isKeyAlredyUsed || alredyHasSingleChar) return

		if (!keyInput?.endsWith('-') && keyInput?.length > 0) {
			keyInput += `-${newKey}`
		} else {
			keyInput += `${newKey}-`
		}
	}

	const handleClear = () => {
		keyInput = ''
		keyInputElement.focus()
	}

	const handleDialogOpen = () => {
		keybindingDialog.showModal()
		keyInputElement.focus()
	}

	const handleDialogClose = () => {
		keyInput = keybinding.key ?? ''
		reset()
	}

	const handleResetBinding = (reset: boolean = true) => {
		form.update((form) => ({ ...form, reset }), { taint: 'untaint-all' })
		submit()
	}
</script>

<Dialog bind:dialog={keybindingDialog} on:close={handleDialogClose} class="keybinding-dialog">
	<form use:enhance method="POST" action="?/keybinding">
		<div class="field">
			<label for="keybinding">
				<input
					bind:this={keyInputElement}
					id="keybinding"
					name="keybinding"
					type="text"
					value={keyInput}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					on:keydown|preventDefault|stopPropagation={handleChange}
					on:click|preventDefault|stopPropagation={() => (keyInput = '')}
					disabled={$submitting}
				/>
			</label>
			<ShortcutKeybinding keybinding={keyInput ?? ''} />
		</div>
		<ErrorMessage error={keyError} />
		<div class="footer">
			<Button disabled={$submitting} type="submit" on:click={() => handleResetBinding(false)}>
				{#if $submitting && !$form.reset}
					<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
				{/if}
				Save
			</Button>
			<div>
				<Button disabled={$submitting} type="button" variant="destructive" on:click={handleClear}
					>Clear</Button
				>
				<Button
					disabled={$submitting}
					type="reset"
					variant="secondary"
					on:click={() => handleResetBinding(true)}
				>
					{#if $submitting && $form.reset}
						<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
					{/if}
					Reset</Button
				>
			</div>
		</div>
	</form>
</Dialog>

<!-- svelte-ignore a11y-interactive-supports-focus -->
<div
	on:click={handleDialogOpen}
	on:keydown={(e) => e.key === 'Enter' && handleDialogOpen()}
	role="button"
	class="keybinding-item"
>
	<span>{formatName(keybinding.run?.name ?? '')}</span>
	<ShortcutKeybinding keybinding={keybinding.key ?? ''} />
</div>

<style>
	.keybinding-item {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--space-base);
		padding: var(--space-sm) var(--space-base);
		cursor: pointer;
		background-color: var(--secondary);
		border: 1px solid var(--secondary-dk);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		height: 48px;
		flex-shrink: 0;
	}

	span {
		color: var(--foreground-dk-muted);
		font-size: 1rem;
		line-height: 1.2rem;
	}

	:global(.keybinding-dialog) {
		max-width: 300px;
		width: 100%;
		padding: var(--space-base);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}

	.field {
		position: relative;
		height: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		user-select: none;
	}

	label {
		position: absolute;
		width: 100%;
		height: 40px;
	}

	input {
		all: unset;
		opacity: 0;
		width: 100%;
		height: 40px;
		cursor: pointer;
	}

	.footer {
		display: flex;
		gap: var(--space-base);
		flex-direction: column;
	}

	.footer > div {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-base);
	}

	.keybinding-item:active {
		background-color: var(--secondary-dk);
	}

	@media (pointer: fine) {
		.keybinding-item:hover {
			background-color: var(--secondary-dk);
		}
	}
</style>

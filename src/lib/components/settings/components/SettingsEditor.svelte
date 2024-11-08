<script lang="ts">
	import { superForm } from 'sveltekit-superforms'
	import { getSettings } from '../settingsContext'
	import { Divider } from '$lib/components/divider'
	import { Button } from '$lib/components/button'
	import { Save } from 'lucide-svelte'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { invalidateAll } from '$app/navigation'
	import { editorStore } from '$lib/components/editor/editorStore'
	import { state } from '$lib/components/editor/state'

	const settings = getSettings()
	let initialSettings = $settings?.editorSettings
	const { form, enhance, errors, submitting } = superForm($settings?.editorSettingsForm!, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				initialSettings = $form
				$editorStore?.setState(state($form))
				await invalidateAll()
			}
		},
		onSubmit: () => {
			form.update(
				(form) => ({ ...form, tabSize: Number(form.tabSize), fontSize: Number(form.fontSize) }),
				{ taint: 'untaint-all' }
			)
		},
		resetForm: false,
		dataType: 'json'
	})

	const handleChange = (field: keyof typeof $form) => {
		form.update((form) => ({ ...form, [field]: !form[field] }), { taint: 'untaint-all' })
	}

	$: hasChanged = () => {
		if (!initialSettings) return false
		const unChangedSettings = new Map(Object.entries(initialSettings))
		const changedSettings = new Map(Object.entries($form))
		for (const [key, value] of unChangedSettings) {
			// Only use != so we can compare i.e 16 to "16"
			if (changedSettings.get(key) != value) return true
		}
		return false
	}
</script>

<form use:enhance method="POST" action="?/editorSettings">
	<header>
		<div>
			<h2>Editor settings</h2>
			<Button type="submit" icon size="sm" disabled={$submitting || !hasChanged()}>
				<Save size={18} stroke-width={1.5} />
			</Button>
		</div>
		<Divider />
	</header>
	<div class="form-fields">
		<div class="form-field">
			<Label for="autoSave" class="editor-setting-label">Auto save</Label>
			<p>Controls whether the editor auto saves unsaved changes.</p>
			<Input
				type="checkbox"
				id="autoSave"
				name="autoSave"
				autocomplete="off"
				disabled={$submitting}
				checked={$form.autoSave}
				on:change={() => handleChange('autoSave')}
				style="width: fit-content"
			/>
			<ErrorMessage error={$errors.autoSave} />
		</div>
		<div class="form-field">
			<Label for="fontSize" class="editor-setting-label">Font size</Label>
			<p>Controls the font size of the editor.</p>
			<Input
				type="number"
				id="fontSize"
				name="fontSize"
				autocomplete="off"
				disabled={$submitting}
				bind:value={$form.fontSize}
				style="width: fit-content"
			/>
			<ErrorMessage error={$errors.fontSize} />
		</div>
		<div class="form-field">
			<Label for="tabSize" class="editor-setting-label">Tab size</Label>
			<p>The number of spaces a tab is equal to.</p>
			<Input
				type="number"
				id="tabSize"
				name="tabSize"
				autocomplete="off"
				disabled={$submitting}
				bind:value={$form.tabSize}
				style="width: fit-content"
			/>
			<ErrorMessage error={$errors.tabSize} />
		</div>
		<div class="form-field">
			<Label for="wordWrap" class="editor-setting-label">Word wrap</Label>
			<p>Controls whether the editor wraps lines.</p>
			<Input
				type="checkbox"
				id="wordWrap"
				name="wordWrap"
				autocomplete="off"
				disabled={$submitting}
				checked={$form.wordWrap}
				on:change={() => handleChange('wordWrap')}
				style="width: fit-content"
			/>
			<ErrorMessage error={$errors.wordWrap} />
		</div>
	</div>
</form>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	header div {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	h2 {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--foreground-dk-muted);
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-4xl);
		margin: var(--space-md) 0;
	}

	.form-field {
		display: flex;
		flex-direction: column;
	}

	.form-field :global(.editor-setting-label) {
		font-size: 1rem;
		font-weight: 500;
		color: var(--foreground-dk-muted);
	}

	.form-field p {
		font-size: 0.875rem;
		color: var(--foreground-md);
		margin-bottom: var(--space-md);
	}
</style>

<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Dialog, DialogHeader } from '$lib/components/dialog'
	import { superForm } from 'sveltekit-superforms'
	import { getSettings } from '../settingsContext'
	import AccountItem from './AccountItem.svelte'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { Loader2 } from 'lucide-svelte'
	import { invalidateAll } from '$app/navigation'

	const settings = getSettings()
	let formError: string | undefined = undefined
	let emailDialog: HTMLDialogElement
	const { form, enhance, errors, submitting, reset } = superForm($settings?.emailForm!, {
		onResult: async ({ result }) => {
			if (['error', 'failure'].includes(result.type)) {
				formError = 'data' in result ? result.data?.error : undefined
			} else if (result.type === 'success') {
				await invalidateAll()
				formError = undefined
				emailDialog.close()
			}
		},
		onSubmit: () => {
			formError = undefined
		}
	})

	const handleClose = () => {
		formError = undefined
		reset()
	}
</script>

<Dialog bind:dialog={emailDialog} withClose={false} on:close={handleClose} class="email-dialog">
	<DialogHeader>Change email</DialogHeader>
	<form use:enhance method="POST" action="?/changeEmail">
		<div class="form-fields">
			<div class="form-field">
				<Label for="email">New email</Label>
				<Input
					type="text"
					id="email"
					name="email"
					placeholder="Enter new email"
					autocomplete="off"
					aria-invalid={$errors.email ? 'true' : undefined}
					bind:value={$form.email}
				/>
				<ErrorMessage error={$errors.email} />
			</div>
		</div>
		<ErrorMessage error={formError} />
		<div class="footer">
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
				{/if}
				Change email</Button
			>
			<Button
				variant="outline"
				type="button"
				disabled={$submitting}
				on:click={() => emailDialog.close()}
			>
				Cancel
			</Button>
		</div>
	</form>
</Dialog>

<AccountItem>
	<h3 slot="title">Email</h3>
	<p slot="description">{$settings?.user.email ?? ''}</p>
	<Button slot="action" variant="outline" on:click={() => emailDialog.showModal()}>
		Change email
	</Button>
</AccountItem>

<style>
	:global(.email-dialog) {
		max-width: 400px;
		width: 100%;
		padding: var(--space-base);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3xl);
		margin-top: var(--space-3xl);
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-base);
	}
</style>

<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Dialog, DialogHeader } from '$lib/components/dialog'
	import { Loader2 } from 'lucide-svelte'
	import AccountItem from './AccountItem.svelte'
	import { getSettings } from '../settingsContext'
	import { superForm } from 'sveltekit-superforms'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'

	const settings = getSettings()
	let formError: string | undefined = undefined
	let passwordDialog: HTMLDialogElement

	const { form, enhance, submitting, errors, reset } = superForm($settings?.passwordResetForm!, {
		onResult: ({ result }) => {
			if (['error', 'failure'].includes(result.type)) {
				formError = 'data' in result ? result.data?.error : undefined
			} else if (result.type === 'success') {
				formError = undefined
				passwordDialog.close()
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

<Dialog
	bind:dialog={passwordDialog}
	withClose={false}
	on:close={handleClose}
	class="password-dialog"
>
	<DialogHeader>Change password</DialogHeader>
	<form use:enhance method="POST" action="?/passwordReset">
		<div class="form-fields">
			<div class="form-field">
				<Label for="currentPassword">Current password</Label>
				<Input
					type="password"
					id="currentPassword"
					name="currentPassword"
					placeholder="Enter your current password"
					autocomplete="off"
					aria-invalid={$errors.currentPassword ? 'true' : undefined}
					bind:value={$form.currentPassword}
				/>
				<ErrorMessage error={$errors.currentPassword} />
			</div>
			<div class="form-field">
				<Label for="newPassword">New password</Label>
				<Input
					type="password"
					id="newPassword"
					name="newPassword"
					placeholder="Enter your new password"
					autocomplete="new-password"
					aria-invalid={$errors.newPassword ? 'true' : undefined}
					bind:value={$form.newPassword}
				/>
				<ErrorMessage error={$errors.newPassword} />
			</div>
		</div>
		<ErrorMessage error={formError} />
		<div class="footer">
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
				{/if}
				Change password</Button
			>
			<Button
				variant="outline"
				type="button"
				disabled={$submitting}
				on:click={() => passwordDialog.close()}
			>
				Cancel
			</Button>
		</div>
	</form>
</Dialog>

<AccountItem>
	<h3 slot="title">Password</h3>
	<p slot="description">Change your password to login to you account.</p>
	<Button slot="action" variant="outline" on:click={() => passwordDialog.showModal()}>
		Change password
	</Button>
</AccountItem>

<style>
	:global(.password-dialog) {
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

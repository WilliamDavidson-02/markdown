<script lang="ts">
	import { superForm } from 'sveltekit-superforms'
	import type { ActionData } from './$types'
	import { Button } from '$lib/components/button'
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { Divider } from '$lib/components/divider'
	import { Input } from '$lib/components/input'
	import { Label } from '$lib/components/label'
	import { ErrorMessage } from '$lib/components/error-message'
	import { Loader2 } from 'lucide-svelte'

	export let data

	export let form: ActionData & { error: string }
	let isLoading = false

	const { form: formData, enhance, errors, submitting } = superForm(data.form)

	const ghLoader = () => {
		isLoading = true
		setTimeout(() => {
			isLoading = false
		}, 20000)
	}
</script>

<section>
	<h1>Login</h1>
	<Button variant="outline" href="/login/github" on:click={ghLoader}>
		{#if isLoading}
			<Loader2 class="animate-spin" size={20} />
		{:else}
			<GithubIcon />
		{/if}
		Continue with GitHub
	</Button>
	<Divider />
	<form method="POST" use:enhance>
		<div class="form-field">
			<Label for="email">Email</Label>
			<Input
				type="text"
				id="email"
				name="email"
				placeholder="Enter your email"
				autocomplete="email"
				aria-invalid={$errors.email ? 'true' : undefined}
				bind:value={$formData.email}
			/>
			<ErrorMessage error={$errors.email} />
		</div>
		<div class="form-field">
			<Label for="password">Password</Label>
			<Input
				type="password"
				id="password"
				name="password"
				placeholder="Enter your password"
				autocomplete="current-password"
				aria-invalid={$errors.password ? 'true' : undefined}
				bind:value={$formData.password}
			/>
			<ErrorMessage error={$errors.password} />
		</div>
		<ErrorMessage error={form?.error ? [form.error] : undefined} />
		<div class="form-actions">
			<Button type="submit">
				{#if $submitting}
					<Loader2 class="animate-spin" size={20} />
				{/if}
				Continue
			</Button>
			<p>Don't have an account? <a href="/register">Register</a></p>
		</div>
	</form>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		width: 100%;
		max-width: 400px;
		color: var(--foreground-dk);
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-actions {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		margin-top: 2rem;
	}

	.form-actions p {
		text-align: center;
		font-size: 0.75rem;
	}

	.form-actions a {
		text-decoration: underline;
	}
</style>

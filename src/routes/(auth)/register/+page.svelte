<script lang="ts">
	import { superForm } from 'sveltekit-superforms'
	import type { ActionData } from './$types'

	export let data
	export let form: ActionData & { error: string }

	const { form: formData, enhance, errors } = superForm(data.form)
</script>

<a href="/login/github">Sign in with GitHub</a>
<form method="POST" use:enhance>
	<label for="email">Email</label>
	<input
		type="text"
		id="email"
		name="email"
		autocomplete="email"
		aria-invalid={$errors.email ? 'true' : undefined}
		bind:value={$formData.email}
	/>
	{#if $errors.email}
		<p class="error-message">{$errors.email}</p>
	{/if}
	<label for="password">Password</label>
	<input
		type="password"
		id="password"
		name="password"
		autocomplete="new-password"
		aria-invalid={$errors.password ? 'true' : undefined}
		bind:value={$formData.password}
	/>
	{#if $errors.password}
		<p class="error-message">{$errors.password}</p>
	{/if}
	{#if form?.error}
		<p class="error-message">{form.error}</p>
	{/if}
	<button type="submit">Create account</button>
	<p>Already have an account? <a href="/login">Login</a></p>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
	}

	button {
		margin-top: 2rem;
	}

	.error-message {
		color: red;
	}
</style>

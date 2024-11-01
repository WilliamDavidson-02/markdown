<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Loader2 } from 'lucide-svelte'
	import { getSettings } from '../settingsContext'
	import { Divider } from '$lib/components/divider'
	import { superForm } from 'sveltekit-superforms'
	import { invalidateAll } from '$app/navigation'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import type { GitHubRepository } from '$lib/utilts/github'
	import { fade } from 'svelte/transition'
	import type { AvailableRepositories } from '../types'

	export let installation: AvailableRepositories

	const settings = getSettings()
	let initialRepositories: GitHubRepository[] | undefined
	let checkList: GitHubRepository[] = []
	let uninstalling = false

	$: getForm = () => {
		return $forms.installations.find((install) => install.installationId === installation.id)
	}

	const {
		form: forms,
		enhance,
		submitting
	} = superForm($settings?.repositoriesForm!, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				await invalidateAll()
				initialRepositories = undefined
			}
		},
		onSubmit: () => {
			const removedRepositories =
				initialRepositories
					?.filter((repo) => !getForm()?.repositories.some((r) => r.id === repo.id))
					.map((repo) => repo.id) ?? []

			const newRepositories =
				getForm()?.repositories.filter(
					(repo) => !initialRepositories?.some((r) => r.id === repo.id)
				) ?? []

			const installations = $forms.installations.map((install) =>
				install.installationId === installation.id
					? { removedRepositories, repositories: newRepositories, installationId: installation.id }
					: install
			)

			forms.set({ installations }, { taint: 'untaint-all' })
		},
		dataType: 'json',
		resetForm: false
	})

	$: if (!initialRepositories) {
		const form = getForm()
		if (form) {
			initialRepositories = [...form.repositories]
			checkList = [...initialRepositories]
		}
	}

	$: hasChanged = () => {
		if (initialRepositories?.length !== checkList.length) return true
		for (const repo of checkList) {
			if (!initialRepositories?.some((r) => r.id === repo.id)) {
				return true
			}
		}
		return false
	}

	$: isChecked = (repo: GitHubRepository) => checkList.some((r) => r.id === repo.id)

	const getUser = (id: number) => $settings?.installations.find((install) => install.id === id)

	const handleChange = (repository: GitHubRepository) => {
		forms.update(
			(forms) => {
				const form = getForm()
				if (!form) return forms

				if (!isChecked(repository)) {
					form.repositories.push(repository)
				} else {
					form.repositories = form?.repositories.filter((repo) => repo.id !== repository.id)
				}
				forms.installations = forms.installations.map((install) =>
					install.installationId === installation.id ? form : install
				)
				checkList = [...form.repositories]

				return forms
			},
			{ taint: 'untaint-all' }
		)
	}

	const handleReset = () => {
		forms.update((forms) => {
			const form = getForm()
			if (!form || !initialRepositories) return forms
			form.repositories = [...initialRepositories]
			forms.installations = forms.installations.map((install) =>
				install.installationId === installation.id ? form : install
			)
			checkList = [...initialRepositories]

			return forms
		})
	}

	const handleUninstall = async () => {
		try {
			uninstalling = true
			await fetch(`/github/un-install`, {
				method: 'DELETE',
				body: JSON.stringify({ installationId: installation.id })
			})

			await invalidateAll()
		} catch (error) {
			console.error(error)
		} finally {
			uninstalling = false
		}
	}
</script>

<div class="user">
	<img src={getUser(installation.id)?.avatarUrl} alt="github user avatar" />
	<div class="user-info">
		<p>{getUser(installation.id)?.username}</p>
		<a href={`https://github.com/${getUser(installation.id)?.username}`} target="_blank"
			>{`https://github.com/${getUser(installation.id)?.username}`}</a
		>
	</div>
	<Button variant="outline" on:click={handleUninstall} disabled={uninstalling || $submitting}>
		{#if uninstalling}
			<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
		{/if}
		Remove {getUser(installation.id)?.username}
	</Button>
</div>
<form action="?/repositories" use:enhance method="POST">
	<ul>
		{#each installation.repositories as repository}
			<li>
				<Label for={repository.id.toString()} class="checkbox-label">
					<Input
						type="checkbox"
						name="repositories"
						value={repository.id}
						id={repository.id.toString()}
						checked={isChecked(repository)}
						on:change={() => handleChange(repository)}
						disabled={$submitting}
					/>
					{repository.name}
				</Label>
			</li>
		{/each}
	</ul>
	{#if hasChanged()}
		<div transition:fade={{ duration: 200 }} class="actions-container">
			<Button type="button" disabled={$submitting} variant="outline" on:click={handleReset}
				>Cancel</Button
			>
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2 size={16} stroke-width={1.5} class="animate-spin" />
				{/if}
				Save
			</Button>
		</div>
	{/if}
</form>
<div class="divider">
	<Divider />
</div>

<style>
	.user {
		display: flex;
		align-items: flex-end;
		gap: var(--space-base);
		width: 100%;
		padding-right: var(--space-sm);
		margin-bottom: var(--space-base);
	}

	.user img {
		width: 4rem;
		height: 4rem;
		border-radius: var(--border-radius-md);
		border: 1px solid var(--secondary-dk);
	}

	.user-info {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.user-info p {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.user-info a {
		text-decoration: underline;
		font-size: 0.75rem;
	}

	.divider {
		margin: var(--space-3xl) 0;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	li {
		cursor: pointer;
		transition: background-color 0.25s;
		border-radius: var(--border-radius-sm);
	}

	li:active,
	li:focus {
		background-color: var(--secondary);
	}

	.actions-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-base);
		margin-top: var(--space-base);
	}

	:global(.checkbox-label) {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		width: 100%;
		cursor: pointer;
	}

	@media (pointer: fine) {
		li:hover {
			background-color: var(--secondary);
		}
	}
</style>

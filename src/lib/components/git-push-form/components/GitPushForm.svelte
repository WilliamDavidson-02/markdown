<script lang="ts">
	import { Button } from '$lib/components/button'
	import { fade, slide } from 'svelte/transition'
	import { getRepositoryBranches } from '../gitBranchesCtx'
	import { repositoryBranchesFormStore } from '../repositoryBranchesStore'
	import { superForm } from 'sveltekit-superforms'
	import { Label } from '$lib/components/label'
	import { Input } from '$lib/components/input'
	import { ErrorMessage } from '$lib/components/error-message'
	import { Loader2, GitBranch, Check } from 'lucide-svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Command, CommandInput, CommandItem, CommandList } from '$lib/components/command'
	import { Textarea } from '$lib/components/textarea'

	export let showGitPushForm = false

	const repositoryBranches = getRepositoryBranches()
	const { form, submitting, enhance, errors, reset } = superForm($repositoryBranchesFormStore!, {
		dataType: 'json'
	})

	let showBranchPopover = false

	$: if (!showGitPushForm) {
		showBranchPopover = false
		reset()
	}

	const handleBranchSelect = (branch: string) => {
		if ($submitting) return
		form.update((f) => ({ ...f, branch }), { taint: 'untaint-all' })
		showBranchPopover = false
	}

	const toggleCreatePullRequest = () => {
		form.update((f) => ({ ...f, createPullRequest: !f.createPullRequest }), {
			taint: 'untaint-all'
		})
	}
</script>

{#if showGitPushForm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="backdrop"
		transition:fade={{ duration: 200 }}
		on:click={() => (showGitPushForm = false)}
		role="button"
		tabindex="-1"
	/>
	<section
		in:slide={{ axis: 'x', duration: 500 }}
		out:slide={{ axis: 'x', duration: 350 }}
		role="dialog"
	>
		<form use:enhance action="?/gitPush" method="POST">
			<div class="form-fields">
				<div class="form-field">
					<Label for="commitMessage">Commit Message</Label>
					<Input
						type="text"
						id="commitMessage"
						name="commitMessage"
						placeholder="Enter a commit message"
						autocomplete="off"
						bind:value={$form.commitMessage}
						disabled={$submitting}
					/>
					<ErrorMessage error={$errors.commitMessage} />
				</div>
				<div class="form-field">
					<Label as="span">Branch</Label>
					<Popover bind:isOpen={showBranchPopover}>
						<PopoverTrigger>
							<Button variant="outline" type="button" class="branch-btn">
								<GitBranch size={16} stroke-width={1.5} />
								{$form.branch.length > 0 ? $form.branch : 'Select a branch'}
							</Button>
						</PopoverTrigger>
						<PopoverContent closeOnScroll={false}>
							<div class="branch-popover-content">
								<Command class="branch-command">
									<CommandInput placeholder="Search branches" />
									<CommandList>
										{#each $repositoryBranches as branch}
											<CommandItem
												value={branch.name}
												onSelect={() => handleBranchSelect(branch.name)}
												data-is-selected={$form.branch === branch.name}
												title={branch.name}
												class="command-item folder"
											>
												{branch.name}
												{#if $form.branch === branch.name}
													<Check size={16} />
												{/if}
											</CommandItem>
										{/each}
									</CommandList>
								</Command>
							</div>
						</PopoverContent>
					</Popover>
					<ErrorMessage error={$errors.branch} />
				</div>
				<div class="pr-fields">
					<div class="form-field">
						<Label for="createPullRequest">
							<Input
								type="checkbox"
								id="createPullRequest"
								name="createPullRequest"
								value={$form.createPullRequest}
								disabled={$form.branch.length === 0 || $submitting}
								on:change={toggleCreatePullRequest}
							/>
							Create PR
						</Label>
					</div>
					{#if $form.createPullRequest}
						<div class="form-field">
							<Label for="prTitle">PR Title</Label>
							<Input
								type="text"
								id="prTitle"
								name="prTitle"
								bind:value={$form.prTitle}
								placeholder="Enter a pull request title"
							/>
						</div>
						<div class="form-field">
							<Label for="prDescription">PR Description</Label>
							<Textarea
								id="prDescription"
								name="prDescription"
								bind:value={$form.prDescription}
								placeholder="Enter a pull request description"
								class="pr-description"
							/>
						</div>
					{/if}
				</div>
			</div>
			<div class="footer">
				<Button
					variant="outline"
					on:click={() => (showGitPushForm = false)}
					disabled={$submitting}
					type="button">Cancel</Button
				>
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Loader2 class="animate-spin" size={20} stroke-width={1.5} />
					{/if}
					{$form.createPullRequest ? 'Commit & Create PR' : 'Commit & Push'}
				</Button>
			</div>
		</form>
	</section>
{/if}

<style>
	section {
		width: 100%;
		max-width: 500px;
		position: fixed;
		right: 0;
		top: 0;
		height: 100svh;
		z-index: 9999;
		overflow: hidden;
		background-color: var(--base);
		color: var(--foreground-dk);
		border-left: 1px solid var(--secondary-dk);
		padding: var(--space-base);
		box-shadow: var(--shadow-overlay);
	}

	.backdrop {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 9998;
		background-color: color-mix(in srgb, var(--base) 25%, transparent);
	}

	form {
		display: grid;
		grid-template-rows: 1fr auto;
		gap: var(--space-base);
		height: 100%;
	}

	.form-fields {
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.form-fields,
	.pr-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.branch-btn) {
		display: flex;
		justify-content: flex-start !important;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.branch-command) {
		background-color: var(--secondary);
		border: 1px solid var(--secondary-dk);
		border-radius: var(--border-radius-sm);
		padding: var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 600px;
	}

	:global(.pr-description) {
		resize: vertical;
		min-height: 300px;
		max-height: 600px;
	}

	.footer {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-base);
	}

	@media (min-width: 500px) {
		.branch-popover-content {
			min-width: 400px;
		}
	}
</style>

<script lang="ts">
	import type { File } from '$lib/components/file-tree/treeStore'
	import { type ComponentType } from 'svelte'
	import { fileIcons } from '$lib/fileIcons'
	import { Loader2 } from 'lucide-svelte'
	import GithubIcon from '$lib/components/GithubIcon.svelte'

	export let file: File
	export let isLoading: string | null = null
	export let isGithubFile = false

	$: iconName = fileIcons.find((i) => i.name === file.icon)?.icon as ComponentType

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})
	}

	$: formattedDate = formatDate(file.updatedAt)
</script>

<li class="search-file">
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-interactive-supports-focus -->
	<div class="file-link" role="link">
		<span class="icon">
			{#if isLoading === file.id}
				<Loader2 class="animate-spin" size={18} stroke-width={1.5} color="var(--foreground-md)" />
			{:else}
				<svelte:component this={iconName} size={18} stroke-width={1.5} />
			{/if}
		</span>
		<p>{file.name}</p>
	</div>
	<div class="file-info">
		{#if isGithubFile}
			<GithubIcon size={14} />
		{/if}
		<p class="date">{formattedDate}</p>
	</div>
</li>

<style>
	.search-file {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: transparent;
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		cursor: pointer;
		height: 36px;
		padding: 0 var(--space-sm);
	}

	.file-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.file-link .icon {
		display: grid;
		place-content: center;
		color: var(--interactive);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--foreground-md);
	}

	.date {
		font-size: 0.875rem;
		font-weight: 400;
		line-height: 1rem;
	}

	@media (pointer: fine) {
		.search-file:hover {
			background-color: var(--secondary);
		}
	}
</style>

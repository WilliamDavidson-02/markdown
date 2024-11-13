<script lang="ts">
	import type { File } from '$lib/components/file-tree/treeStore'
	import { type ComponentType } from 'svelte'
	import { fileIcons, iconColors } from '$lib/fileIcons'
	import { Loader2 } from 'lucide-svelte'
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { getFoldersToFilePos } from '$lib/utilts/helpers'
	import { isFolder } from '$lib/utilts/tree'
	import { treeStore } from '$lib/components/file-tree/treeStore'
	import { githubTree } from '$lib/components/github-tree/githubTreeStore'

	export let file: File
	export let isLoading: string | null = null
	export let isGithubFile = false

	$: iconName = fileIcons.find((i) => i.name === file.icon)?.icon as ComponentType
	$: color = iconColors.find((c) => c.color === file.iconColor)?.color ?? iconColors[0].color

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})
	}

	$: formattedDate = formatDate(file.updatedAt)
	$: tree = isGithubFile ? $githubTree : $treeStore
	$: path = getFoldersToFilePos(
		tree.flat().filter((i) => isFolder(i)),
		file.id
	)
		.map((i) => i.name)
		.join('/')
</script>

<li class="search-file">
	<div class="file-info-container">
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-interactive-supports-focus -->
		<div class="file-link" role="link">
			<span class="icon">
				{#if isLoading === file.id}
					<Loader2 class="animate-spin" size={18} stroke-width={1.5} color="var(--foreground-md)" />
				{:else}
					<svelte:component this={iconName} size={18} stroke-width={1.5} {color} />
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
	</div>
	{#if path.length > 0}
		<div class="path">{path}</div>
	{/if}
</li>

<style>
	.search-file {
		padding: 0 var(--space-sm);
		user-select: none;
		cursor: pointer;
	}

	.file-info-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 36px;
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

	.path {
		font-size: 0.75rem;
		font-weight: 400;
		line-height: 1rem;
		color: var(--foreground-md);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-bottom: var(--space-sm);
	}

	.date {
		font-size: 0.875rem;
		font-weight: 400;
		line-height: 1rem;
	}
</style>

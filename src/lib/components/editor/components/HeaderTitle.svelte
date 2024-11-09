<script lang="ts">
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { fileIcons } from '$lib/fileIcons'
	import { Loader2 } from 'lucide-svelte'
	import { editorSave } from '../editorStore'

	$: status = $editorSave.status
	$: fileIcon = fileIcons.find((icon) => icon.name === $selectedFile?.icon)
</script>

<div>
	<svelte:component this={fileIcon?.icon} size={16} color="var(--interactive-active)" />
	<h1>{$selectedFile?.name}</h1>
	{#if status === 'saving'}
		<Loader2 size={12} color="var(--foreground-md)" class="animate-spin" />
	{:else if status !== 'saved'}
		<div class="status" data-status={status} />
	{/if}
</div>

<style>
	h1 {
		font-size: 0.75rem;
		font-weight: 400;
		line-height: 1rem;
		color: var(--foreground-md);
	}

	div {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		position: relative;
		user-select: none;
	}

	.status {
		width: 5px;
		height: 5px;
		border-radius: 100vmax;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: calc(100% + var(--space-sm));
	}

	.status[data-status='unsaved'] {
		background-color: var(--foreground-li);
	}

	.status[data-status='error'] {
		background-color: var(--danger-active);
	}
</style>

<script lang="ts">
	import { Folder, FolderOpen } from 'lucide-svelte'
	import { slide } from 'svelte/transition'

	export let name: string
	export let iconColor: string = 'var(--foreground-md)'

	let isOpen = false

	const toggleFolder = () => {
		isOpen = !isOpen
	}
</script>

<button class="folder-header" on:click={toggleFolder}>
	<span class="icon">
		{#if isOpen}
			<FolderOpen color={iconColor} size={20} />
		{:else}
			<Folder color={iconColor} size={20} />
		{/if}
	</span>
	<p>{name}</p>
</button>
{#if isOpen}
	<div transition:slide={{ duration: 200 }} class="folder-content">
		<slot />
	</div>
{/if}

<style>
	.folder-header {
		all: unset;
		display: flex;
		align-items: center;
		background-color: var(--base);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		user-select: none;
		cursor: pointer;
		height: 36px;
		padding-right: var(--space-sm);
	}

	p {
		color: var(--foreground-dk);
		font-size: 1rem;
		font-weight: 400;
		line-height: 20px;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon {
		display: grid;
		place-content: center;
		height: 36px;
		width: 36px;
		flex-shrink: 0;
	}

	.folder-header:active {
		background-color: var(--secondary);
	}

	.folder-content {
		padding-left: var(--space-sm);
	}

	@media (pointer: fine) {
		.folder-header:hover {
			background-color: var(--secondary);
		}
	}
</style>

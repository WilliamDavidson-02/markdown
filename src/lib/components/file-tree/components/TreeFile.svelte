<script lang="ts">
	import type { ComponentType } from 'svelte'
	import { fileIcons, type FileIcon } from '$lib/fileIcons'

	export let name: string
	export let id: string
	export let icon: FileIcon['name'] | null = 'File'
	export let iconColor: string = 'var(--interactive-active)'

	$: iconName = fileIcons.find((i) => i.name === icon)?.icon as ComponentType
</script>

<li>
	<a class="file" href={`/${id}`}>
		<span class="icon">
			<svelte:component this={iconName} color={iconColor} size={20} />
		</span>
		<p>{name}</p>
	</a>
</li>

<style>
	.file {
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

	.file:active {
		background-color: var(--secondary);
	}

	@media (pointer: fine) {
		.file:hover {
			background-color: var(--secondary);
		}
	}
</style>

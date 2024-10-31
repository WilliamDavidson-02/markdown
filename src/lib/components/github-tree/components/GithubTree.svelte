<script lang="ts">
	import { TreeLabel } from '$lib/components/file-tree'
	import { isFolder } from '$lib/utilts/tree'
	import { githubTree } from '../githubTreeStore'
	import GithubTreeFolder from './GithubTreeFolder.svelte'
</script>

<ul class="file-tree">
	{#each $githubTree as group}
		<li class="group">
			<TreeLabel date={group[0].updatedAt.toString()} />
			<ul>
				{#each group as item}
					{#if isFolder(item)}
						<GithubTreeFolder folder={item} />
					{/if}
				{/each}
			</ul>
		</li>
	{/each}
</ul>

<style>
	.file-tree {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-height: 100%;
		max-width: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		user-select: none;
	}

	.group {
		display: flex;
		flex-direction: column;
	}
</style>

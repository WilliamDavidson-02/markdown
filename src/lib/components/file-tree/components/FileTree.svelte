<script lang="ts">
	import { TreeFile, TreeFolder, TreeLabel } from '$lib/components/file-tree'
	import { isFolder } from '$lib/utilts/tree'
	import { treeStore } from '../treeStore'
</script>

<ul class="file-tree">
	{#each $treeStore as group}
		<li class="group">
			<TreeLabel date={group[0].updatedAt.toString()} />
			<ul>
				{#each group as item}
					{#if isFolder(item)}
						<TreeFolder folder={item} />
					{:else}
						<TreeFile
							name={item.name ?? 'Untitled'}
							icon={item.icon}
							iconColor={item.iconColor ?? ''}
							id={item.id}
						/>
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

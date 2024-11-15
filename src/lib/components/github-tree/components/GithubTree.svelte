<script lang="ts">
	import { TreeLabel } from '$lib/components/file-tree'
	import { isFolder } from '$lib/utilts/tree'
	import { githubTree } from '../githubTreeStore'
	import GithubTreeFolder from './GithubTreeFolder.svelte'
	import { moveToDialog, type Folder } from '$lib/components/file-tree/treeStore'
	import { getNestedFileIds, getNestedFolderIds } from '$lib/utilts/helpers'
	import { MoveTo } from '$lib/components/move-to'

	let folder: Folder | null = null

	$: if ($moveToDialog.target) {
		folder =
			$githubTree
				.flat()
				.filter(isFolder)
				.find((f) => {
					if (!$moveToDialog.target) return false
					if (isFolder($moveToDialog.target)) {
						const nestedIds = getNestedFolderIds([f])
						return nestedIds.includes($moveToDialog.target.id)
					}
					const nestedFileIds = getNestedFileIds([f])
					return nestedFileIds.includes($moveToDialog.target.id)
				}) ?? null
	}
</script>

<MoveTo folders={folder ? [folder] : []} isGithub={true} />

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

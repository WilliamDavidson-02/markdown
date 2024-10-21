<script lang="ts">
	import { TreeFile, TreeFolder, TreeLabel } from '$lib/components/file-tree'
</script>

<div class="file-tree">
	<div>
		<TreeLabel date="2024-10-21" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-10-18" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-09-30" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-08-30" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-07-30" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-06-30" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
	<div>
		<TreeLabel date="2024-05-30" />
		<TreeFile name="Markdown docs 1" />
		<TreeFolder name="Mode markdown">
			<TreeFile name="Markdown docs 2" />
			<TreeFile name="Markdown docs 3" />
			<TreeFolder name="Nested folder">
				<TreeFile name="Markdown docs 4" />
				<TreeFile name="Markdown docs 5" />
			</TreeFolder>
		</TreeFolder>
		<TreeFile name="Markdown docs 6" />
	</div>
</div>

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
</style>

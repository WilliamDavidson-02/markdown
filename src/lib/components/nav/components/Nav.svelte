<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Search, TableOfContents, Folder, SquarePen, Trash2, Settings } from 'lucide-svelte'
	import { navStore } from '../store'
	import { onMount } from 'svelte'
	import { TreeFile, FileTree, TreeFolder, TreeLabel } from '$lib/components/file-tree'

	let isResizing = false
	let navWidth = 400

	onMount(() => {
		navWidth = parseInt(window.localStorage.getItem('navWidth') || '400')

		const closeNav = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') {
				ev.preventDefault()
				navStore.set(false)
			}
		}

		const handleMove = (ev: PointerEvent) => {
			if (!isResizing) return
			if (ev.clientX < 300 || ev.clientX > 500) return
			navWidth = ev.clientX
		}

		const handleUp = () => {
			isResizing = false
			window.localStorage.setItem('navWidth', navWidth.toString())
		}

		window.addEventListener('keydown', closeNav)
		window.addEventListener('pointermove', handleMove)
		window.addEventListener('pointerup', handleUp)
		return () => {
			window.removeEventListener('keydown', closeNav)
			window.removeEventListener('pointermove', handleMove)
			window.removeEventListener('pointerup', handleUp)
		}
	})
</script>

<nav style:width={`${!$navStore ? 0 : navWidth}px`}>
	<aside>
		<div class="between">
			<div class="btn-icons">
				<Button size="sm" variant="ghost" icon>
					<Search size={20} stroke-width={1.5} />
				</Button>
				<Button size="sm" variant="ghost" icon>
					<TableOfContents size={20} stroke-width={1.5} />
				</Button>
			</div>
			<div class="btn-icons">
				<Button size="sm" variant="ghost" icon>
					<Folder size={20} stroke-width={1.5} />
				</Button>
				<Button size="sm" variant="ghost" icon>
					<SquarePen size={20} stroke-width={1.5} />
				</Button>
			</div>
		</div>
		<FileTree>
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
		</FileTree>
		<div class="between">
			<Button size="sm" variant="ghost" icon>
				<Trash2 size={20} stroke-width={1.5} />
			</Button>
			<Button size="sm" variant="ghost" icon>
				<Settings size={20} stroke-width={1.5} />
			</Button>
		</div>
	</aside>
	<div class="handle" on:pointerdown|preventDefault|stopPropagation={() => (isResizing = true)} />
</nav>

<style>
	nav {
		position: relative;
		height: 100vh;
		background: var(--base);
		color: var(--foreground-dk);
		border-right: 1px solid var(--secondary-dk);
		overflow: hidden;
		flex-grow: 1;
		flex-shrink: 0;
	}

	aside {
		width: 100%;
		height: 100vh;
		padding: var(--space-base);
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: var(--space-base);
	}

	.handle {
		position: absolute;
		right: 0;
		top: 0;
		width: 7px;
		height: 100vh;
		cursor: ew-resize;
	}

	.between {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-icons {
		display: flex;
		gap: var(--space-sm);
	}

	.file-tree {
		flex-grow: 1;
	}
</style>

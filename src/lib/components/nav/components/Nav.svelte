<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Search, TableOfContents, Folder, SquarePen, Trash2, Settings } from 'lucide-svelte'
	import { navStore } from '../store'
	import { onMount } from 'svelte'

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
		<div class="file-tree"></div>
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
		display: flex;
		flex-direction: column;
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

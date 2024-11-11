<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Search, TableOfContents, Folder, SquarePen, Trash2, Settings } from 'lucide-svelte'
	import { getNavContext, NAV_CONTEXT_NAME } from '../store'
	import { onMount } from 'svelte'
	import { FileTree } from '$lib/components/file-tree'
	import { OutlinePanel } from '$lib/components/outline-panel'
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { getSettings } from '$lib/components/settings/settingsContext'
	import { GithubTree } from '$lib/components/github-tree'

	export let fileDialog: HTMLDialogElement
	export let folderDialog: HTMLDialogElement
	export let trashDialog: HTMLDialogElement
	export let settingsDialog: HTMLDialogElement
	export let searchDialog: HTMLDialogElement
	export let isCurrentDocGithub: boolean

	const settings = getSettings()
	const navContext = getNavContext()

	let isResizing = false
	let showOutlinePanel = false
	let showGithubPanel = isCurrentDocGithub ? true : false

	onMount(() => {
		const localNavContext = window.localStorage.getItem(NAV_CONTEXT_NAME)
		if (localNavContext) {
			navContext.update((state) => ({ ...state, ...JSON.parse(localNavContext) }))
		}

		// navWidth = parseInt(window.localStorage.getItem('navWidth') || '400')

		const handleMove = (ev: PointerEvent) => {
			if (!isResizing) return
			if (ev.clientX < 300 || ev.clientX > 500) return
			navContext.update((state) => ({ ...state, width: ev.clientX }))
		}

		const handleUp = () => {
			isResizing = false
			window.localStorage.setItem(NAV_CONTEXT_NAME, JSON.stringify({ ...$navContext }))
		}

		window.addEventListener('pointermove', handleMove)
		window.addEventListener('pointerup', handleUp)
		return () => {
			window.removeEventListener('pointermove', handleMove)
			window.removeEventListener('pointerup', handleUp)
		}
	})
</script>

<nav style:width={`${!$navContext.open ? 0 : $navContext.width}px`}>
	<aside>
		<div class="between">
			<div class="btn-icons">
				<Button on:click={() => searchDialog.showModal()} size="sm" variant="ghost" icon>
					<Search size={20} stroke-width={1.5} />
				</Button>
				<Button
					on:click={() => (showOutlinePanel = !showOutlinePanel)}
					size="sm"
					variant="ghost"
					icon
					data-button-toggled={showOutlinePanel}
				>
					<TableOfContents size={20} stroke-width={1.5} />
				</Button>
				{#if $settings && $settings.installations.length > 0}
					<Button
						on:click={() => (showGithubPanel = !showGithubPanel)}
						size="sm"
						variant="ghost"
						icon
						data-button-toggled={showGithubPanel}
					>
						<GithubIcon size={20} />
					</Button>
				{/if}
			</div>
			<div class="btn-icons">
				<Button on:click={() => folderDialog.showModal()} size="sm" variant="ghost" icon>
					<Folder size={20} stroke-width={1.5} />
				</Button>
				<Button on:click={() => fileDialog.showModal()} size="sm" variant="ghost" icon>
					<SquarePen size={20} stroke-width={1.5} />
				</Button>
			</div>
		</div>
		{#if showOutlinePanel}
			<OutlinePanel />
		{:else if showGithubPanel}
			<GithubTree />
		{:else}
			<FileTree />
		{/if}
		<div class="between">
			<Button on:click={() => trashDialog.showModal()} size="sm" variant="ghost" icon>
				<Trash2 size={20} stroke-width={1.5} />
			</Button>
			<Button on:click={() => settingsDialog.showModal()} size="sm" variant="ghost" icon>
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
		flex-shrink: 0;
	}

	aside {
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
</style>

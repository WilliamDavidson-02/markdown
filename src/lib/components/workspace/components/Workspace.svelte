<script lang="ts">
	import { Editor, Header } from '$lib/components/editor'
	import { onMount } from 'svelte'
	import Preview from './Preview.svelte'
	import { editorStore, type EditorStore } from '$lib/components/editor/editorStore'
	import { getWorkspaceContext } from '$lib/components/workspace'
	import { GripVertical } from 'lucide-svelte'

	let headerElement: HTMLElement
	let editorElement: HTMLDivElement
	let previewElement: HTMLDivElement
	let currentScrollTarget: HTMLElement | null = null
	let headerHeight = 0
	let editorView: EditorStore
	let isResizing = false
	let widths = [100, 0] // [editor, preview]
	let container: HTMLDivElement

	const workspace = getWorkspaceContext()
	let resizeObserver: ResizeObserver | null = null

	$: if (headerElement) {
		headerHeight = headerElement.clientHeight
		resizeObserver = new ResizeObserver(() => {
			if (headerElement) {
				headerHeight = headerElement.clientHeight
			}
		})
		resizeObserver.observe(headerElement)
	}

	$: {
		if ($workspace.view === 'split') {
			widths = [50, 50]
		} else if ($workspace.view === 'preview') {
			widths = [0, 100]
		} else {
			widths = [100, 0]
		}
	}

	onMount(() => {
		const editorScroller = editorElement.querySelector('.cm-scroller')
		editorStore.subscribe((value) => (editorView = value))

		const handleScroll = (ev: Event) => {
			if ($workspace.view !== 'split') return

			const target = ev.target as HTMLElement
			const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight)

			if (currentScrollTarget === editorElement) {
				previewElement.scrollTop =
					scrollRatio * (previewElement.scrollHeight - previewElement.clientHeight)
			} else if (editorView) {
				const { scrollHeight, clientHeight } = editorView.scrollDOM
				editorView.scrollDOM.scrollTo({
					top: scrollRatio * (scrollHeight - clientHeight)
				})
			}
		}

		const setCurrentScrollTarget = (target: HTMLElement) => (currentScrollTarget = target)

		const handleResize = (ev: PointerEvent) => {
			if (!isResizing) return
			const containerRect = container.getBoundingClientRect()
			let fromContainerToHandle = ((ev.clientX - containerRect.left) / containerRect.width) * 100

			if (fromContainerToHandle < 5) fromContainerToHandle = 5
			if (fromContainerToHandle > 95) fromContainerToHandle = 95

			widths = [fromContainerToHandle, 100 - fromContainerToHandle]
		}

		const handleUp = () => (isResizing = false)

		editorScroller?.addEventListener('scroll', handleScroll)
		previewElement?.addEventListener('scroll', handleScroll)
		editorElement?.addEventListener('mouseover', () => setCurrentScrollTarget(editorElement))
		previewElement?.addEventListener('mouseover', () => setCurrentScrollTarget(previewElement))
		window.addEventListener('pointermove', handleResize)
		window.addEventListener('pointerup', handleUp)
		return () => {
			editorScroller?.removeEventListener('scroll', handleScroll)
			previewElement?.removeEventListener('scroll', handleScroll)
			editorElement?.removeEventListener('mouseover', () => setCurrentScrollTarget(editorElement))
			previewElement?.removeEventListener('mouseover', () => setCurrentScrollTarget(previewElement))
			window.removeEventListener('pointermove', handleResize)
			window.removeEventListener('pointerup', handleUp)

			if (resizeObserver) {
				resizeObserver.disconnect()
			}
		}
	})
</script>

<div bind:this={container} class="container">
	<Header bind:headerElement />
	<div style="height: calc(100svh - {headerHeight}px);" class="workspace">
		<Editor
			bind:editorElement
			style="display: {['editor', 'split'].includes($workspace.view)
				? 'block'
				: 'none'}; width: {widths[0]}%;"
		/>
		{#if $workspace.view === 'split'}
			<div class="divider">
				<div
					class="handle"
					on:pointerdown|preventDefault|stopPropagation={() => (isResizing = true)}
				>
					<GripVertical />
				</div>
			</div>
		{/if}
		<Preview
			bind:previewElement
			style="display: {['preview', 'split'].includes($workspace.view)
				? 'block'
				: 'none'}; width: {widths[1]}%;"
		/>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		max-height: 100svh;
		height: 100%;
		flex-grow: 1;
	}

	.workspace {
		flex-grow: 1;
		display: flex;
	}

	.divider {
		height: inherit;
		width: 1px;
		background-color: var(--secondary-dk);
		position: relative;
	}

	.handle {
		background-color: var(--base);
		color: var(--foreground-dk);
		border: 1px solid var(--secondary-dk);
		box-shadow: var(--shadow-overlay);
		cursor: col-resize;
		border-radius: var(--border-radius-md);
		position: absolute;
		z-index: 100;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		justify-content: center;
		align-items: center;
		width: fit-content;
		aspect-ratio: 9 / 16;
	}
</style>

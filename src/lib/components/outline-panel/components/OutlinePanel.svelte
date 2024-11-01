<script lang="ts">
	import { onMount } from 'svelte'
	import { editorStore, type EditorStore } from '../../editor/editorStore'
	import type { EditorState, Line } from '@codemirror/state'
	import type { OutlinePanel } from '../types'

	let outlinePanel: OutlinePanel[] = []
	let pointerPos = 0
	let editorView: EditorStore
	let currentHeading: OutlinePanel | undefined
	let headingsContainer: HTMLElement

	const updatePointerPos = () => {
		if (currentHeading && headingsContainer) {
			const headingElement = headingsContainer.querySelector(
				`[data-header="${currentHeading?.line.number}"]`
			)
			if (!headingElement) return
			const headingRect = headingElement.getBoundingClientRect()
			const containerRect = headingsContainer.getBoundingClientRect()
			pointerPos = headingRect.top - containerRect.top - 8
		}
	}

	const scrollIntoView = (line: Line, ev: MouseEvent) => {
		if (!editorView) return

		const pointerRect = headingsContainer.getBoundingClientRect()
		const currentRect = (ev.target as HTMLElement)?.getBoundingClientRect()
		const lineTop = editorView.lineBlockAt(line.from).top

		pointerPos = currentRect.top - pointerRect.top - 8 // 8 for gap
		editorView.dispatch({
			selection: {
				anchor: line.from,
				head: line.from
			}
		})
		editorView.scrollDOM.scrollTo({
			top: lineTop,
			behavior: 'smooth'
		})
		editorView.focus()
	}

	onMount(() => {
		const getOutlinePanel = (state: EditorState) => {
			const headerPattern = /^(#{1,6})\s+(.+)/
			const currentLine = state.doc.lineAt(state.selection.main.from)
			outlinePanel = []

			for (let i = 1; i <= state.doc.lines; i++) {
				const line = state.doc.line(i)
				if (headerPattern.test(line.text)) {
					outlinePanel.push({ header: line.text.replace(/^#+\s+/, '').trim(), line })
					if (line.number <= currentLine.number) {
						currentHeading = outlinePanel[outlinePanel.length - 1]
					}
				}
			}
		}

		editorStore.subscribe((value) => {
			if (value) {
				editorView = value
				getOutlinePanel(value.state)
				updatePointerPos()
			}
		})
	})
</script>

<div class="outline-panel">
	<div class="pointer-container">
		<div class="pointer" style="top: {pointerPos}px" />
	</div>
	<div bind:this={headingsContainer} class="headings">
		{#each outlinePanel as item}
			<button
				class="heading"
				on:click={(ev) => scrollIntoView(item.line, ev)}
				aria-current={currentHeading === item}
				data-header={item.line.number}
			>
				{item.header}
			</button>
		{/each}
	</div>
</div>

<style>
	.outline-panel {
		display: grid;
		grid-template-columns: 2px 1fr;
		gap: var(--space-sm);
		height: fit-content;
		max-height: 100%;
		width: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		user-select: none;
	}

	.pointer-container {
		background-color: color-mix(in srgb, var(--interactive) 40%, transparent);
		width: 2px;
		position: relative;
		border-radius: 100vmax;
		overflow: hidden;
	}

	.pointer {
		position: absolute;
		background-color: var(--interactive-active);
		width: 100%;
		height: calc(34px + 16px);
		transition: top 0.3s;
		border-radius: 100vmax;
	}

	.headings {
		display: grid;
		grid-template-rows: repeat(auto-fill, 34px);
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		max-width: calc(100% - 2px - var(--space-sm));
		width: calc(100% - 2px - var(--space-sm));
	}

	.heading {
		all: unset;
		padding: 0 var(--space-sm);
		border-radius: var(--border-radius-sm);
		transition: background-color 0.2s;
		cursor: pointer;
		color: var(--foreground-dk);
		font-size: 1rem;
		font-weight: 500;
		line-height: 24px;
		height: 34px;
		max-width: calc(100% - 2px - var(--space-sm));
		width: calc(100% - 2px - var(--space-sm));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.heading:active {
		background-color: var(--secondary);
	}

	@media (pointer: fine) {
		.heading:hover {
			background-color: var(--secondary);
		}
	}
</style>

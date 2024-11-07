<script lang="ts">
	import { unified } from 'unified'
	import remarkParse from 'remark-parse'
	import remarkFrontmatter from 'remark-frontmatter'
	import remarkGfm from 'remark-gfm'
	import remarkRehype from 'remark-rehype'
	import rehypeHighlight from 'rehype-highlight'
	import rehypeStringify from 'rehype-stringify'
	import 'github-markdown-css/github-markdown.css'
	import 'highlight.js/styles/github-dark.css'
	import { editorStore } from '$lib/components/editor/editorStore'

	export let previewElement: HTMLDivElement

	$: md = unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeHighlight)
		.use(rehypeStringify)
		.processSync($editorStore?.state.doc.toString() ?? '')
</script>

<div class="wrapper" bind:this={previewElement} {...$$restProps}>
	<div class="markdown-body">{@html md}</div>
</div>

<style>
	.wrapper {
		background-color: var(--secondary);
		overflow-y: auto;
		max-height: 100%;
		height: 100%;
	}

	.markdown-body {
		box-sizing: border-box;
		min-width: 200px;
		max-width: 980px;
		margin: 0 auto;
		margin-bottom: 100%;
		padding: 45px;

		--focus-outlineColor: var(--interactive-active);
		--fgColor-default: var(--foreground-dk);
		--fgColor-muted: var(--foreground-md);
		--fgColor-accent: var(--interactive);
		--bgColor-default: var(--secondary);
		--bgColor-muted: var(--secondary-dk);
		--bgColor-neutral-muted: var(--secondary-dk);
		--bgColor-attention-muted: var(--secondary-dk);
		--borderColor-default: var(--foreground-li);
		--borderColor-muted: var(--secondary-dk);
		--borderColor-neutral-muted: var(--secondary-dk);
		--borderColor-accent-emphasis: var(--interactive-accent);
	}

	@media (max-width: 767px) {
		.markdown-body {
			padding: var(--space-base);
		}
	}
</style>

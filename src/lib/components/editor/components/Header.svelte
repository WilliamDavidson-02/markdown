<script lang="ts">
	import { Button } from '$lib/components/button'
	import { navStore } from '$lib/components/nav/store'
	import { ChevronsRight, ChevronsLeft, Ellipsis, CornerUpRight, Trash2 } from 'lucide-svelte'
	import HeaderTitle from './HeaderTitle.svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { Divider } from '$lib/components/divider'
	import { editorStore } from '../editorStore'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { getCharacterCount, getWordCount } from '$lib/utilts/helpers'
	import { formatDateWithTime } from '$lib/utilts/date'

	$: doc = $editorStore?.state.doc.toString()
	$: lastEdited = $selectedFile?.updatedAt
</script>

<header>
	<Button icon size="sm" variant="ghost" on:click={() => navStore.update((state) => !state)}>
		{#if $navStore}
			<ChevronsLeft size={20} stroke-width={1.5} />
		{:else}
			<ChevronsRight size={20} stroke-width={1.5} />
		{/if}
	</Button>
	<HeaderTitle />
	<Popover>
		<PopoverTrigger>
			<Ellipsis size={20} stroke-width={1.5} />
		</PopoverTrigger>
		<PopoverContent class="dropdown">
			<Dropdown>
				<DropdownGroup>
					<DropdownItem>
						<div class="dropdown-item">
							<CornerUpRight size={16} stroke-width={1.5} />
							<span>Move to</span>
						</div>
					</DropdownItem>
					<DropdownItem>
						<div class="dropdown-item">
							<Trash2 size={16} stroke-width={1.5} />
							<span>Move to Trash</span>
						</div>
					</DropdownItem>
				</DropdownGroup>
				{#if $selectedFile}
					<Divider />
					<DropdownGroup>
						<div class="doc-info">
							<p>Character count: {getCharacterCount(doc ?? '')}</p>
							<p>Word count: {getWordCount(doc ?? '')}</p>
							{#if lastEdited}
								<p>Last edited: {formatDateWithTime(lastEdited)}</p>
							{/if}
						</div>
					</DropdownGroup>
				{/if}
			</Dropdown>
		</PopoverContent>
	</Popover>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--space-base);
		background-color: var(--base);
		color: var(--foreground-dk);
		height: var(--header-height, 40px);
	}

	:global(.dropdown) {
		right: 0;
		transform: translateX(0) translateY(var(--space-sm)) !important;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.doc-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-md);
		color: var(--foreground-md);
		font-size: 0.75rem;
		line-height: 1rem;
		font-weight: 400;
	}
</style>

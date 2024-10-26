<script lang="ts">
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/popover'
	import { Dropdown, DropdownGroup, DropdownItem } from '$lib/components/dropdown'
	import { Ellipsis, CornerUpRight, Trash2, Loader2 } from 'lucide-svelte'
	import { Divider } from '$lib/components/divider'
	import { editorStore } from '../editorStore'
	import { selectedFile } from '$lib/components/file-tree/treeStore'
	import { getCharacterCount, getWordCount } from '$lib/utilts/helpers'
	import { formatDateWithTime } from '$lib/utilts/date'

	$: doc = $editorStore?.state.doc.toString()
	$: lastEdited = $selectedFile?.updatedAt

	let isLoading = {
		item: '',
		loading: false
	}

	const moveToTrash = async () => {
		try {
			isLoading = {
				item: 'move-to-trash',
				loading: true
			}
			const res = await fetch(`/${$selectedFile?.id}/move-to-trash`, {
				method: 'POST',
				body: JSON.stringify({ fileId: $selectedFile?.id })
			})
		} catch (error) {
			console.log(error)
		} finally {
			isLoading = {
				item: '',
				loading: false
			}
		}
	}
</script>

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
				<DropdownItem on:click={moveToTrash} on:keydown={moveToTrash}>
					<div class="dropdown-item">
						<Trash2 size={16} stroke-width={1.5} />
						<span>Move to Trash</span>
					</div>
					{#if isLoading.loading && isLoading.item === 'move-to-trash'}
						<Loader2 class="animate-spin" size={14} />
					{/if}
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

<style>
	:global(.dropdown) {
		right: 0;
		transform: translateX(0) translateY(var(--space-sm));
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

<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Trash2, Undo2 } from 'lucide-svelte'

	const handleUndo = (ev: MouseEvent) => {
		ev.preventDefault()
		ev.stopPropagation()
		console.log('undo')
	}
	const handleDelete = (ev: MouseEvent) => {
		ev.preventDefault()
		ev.stopPropagation()
		console.log('delete')
	}
</script>

<div class="trash-actions">
	<Button variant="ghost" icon size="sm" class="trash-action" on:click={handleUndo}>
		<Undo2 size={16} color="var(--foreground-md)" />
	</Button>
	<Button variant="ghost" icon size="sm" class="trash-action" on:click={handleDelete}>
		<Trash2 size={16} color="var(--foreground-md)" />
	</Button>
</div>

<style>
	.trash-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.trash-actions :global(.trash-action:active) {
		background-color: var(--secondary-dk);
	}

	@media (pointer: fine) {
		.trash-actions :global(.trash-action:hover) {
			background-color: var(--secondary-dk);
		}
	}
</style>

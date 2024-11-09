<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
	export let disabled = false
</script>

<!-- Add class based on disabled prop -->
<div class:disabled on:click|stopPropagation on:keydown|stopPropagation {...$$restProps}>
	<slot />
</div>

<style>
	div {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		line-height: 20px;
		padding: var(--space-xs) var(--space-md);
		background-color: var(--secondary);
		transition: background-color 0.25s;
	}

	div:not(.disabled) {
		cursor: pointer;
	}

	div:active:not(.disabled) {
		background-color: var(--secondary-dk);
	}

	div.disabled {
		color: var(--foreground-md);
		cursor: not-allowed;
	}

	@media (pointer: fine) {
		div:hover:not(.disabled) {
			background-color: var(--secondary-dk);
		}
	}
</style>

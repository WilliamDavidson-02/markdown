<div class={$$restProps.class}>
	<slot />
</div>

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) 0;
		border-radius: var(--border-radius-sm);
		cursor: pointer;
		user-select: none;
		transition: background-color 0.25s;
	}

	div:active {
		background-color: var(--secondary);
	}

	@media (pointer: fine) {
		div:hover {
			background-color: var(--secondary);
		}
	}
</style>

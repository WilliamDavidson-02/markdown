<div>
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
		cursor: pointer;
	}

	div:active {
		background-color: var(--secondary-dk);
	}

	@media (pointer: fine) {
		div:hover {
			background-color: var(--secondary-dk);
		}
	}
</style>

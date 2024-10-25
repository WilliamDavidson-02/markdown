<div>
	<slot />
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		background-color: var(--secondary);
		color: var(--foreground-dk);
		padding: var(--space-base) 0;
		border-radius: var(--border-radius-sm);
		user-select: none;
	}

	@media (min-width: 350px) {
		div {
			min-width: 300px;
		}
	}
</style>

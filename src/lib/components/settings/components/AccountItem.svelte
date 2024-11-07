<div class="container">
	<div class="content">
		<div class="title">
			<slot name="title" />
		</div>
		<div class="description">
			<slot name="description" />
		</div>
	</div>
	<div class="action">
		<slot name="action" />
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-base);
	}

	.content {
		flex: 1;
		display: flex;
		justify-content: center;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.title :global(*) {
		font-size: 1rem;
		font-weight: 500;
		color: var(--foreground-dk-muted);
	}

	.description {
		font-size: 0.75rem;
		color: var(--foreground-md);
	}

	.action {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>

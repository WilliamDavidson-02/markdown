<div class="footer">
	<slot />
</div>

<style>
	.footer {
		display: flex;
		gap: var(--space-base);
		align-items: center;
		margin-top: var(--space-3xl);
	}

	:global(.footer > button) {
		width: 100%;
	}
</style>

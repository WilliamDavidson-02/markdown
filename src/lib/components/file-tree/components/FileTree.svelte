<div>
	<slot />
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 1.25rem;
		max-height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
</style>

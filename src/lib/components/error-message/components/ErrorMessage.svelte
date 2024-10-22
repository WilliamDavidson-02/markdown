<script lang="ts">
	export let error: string[] | undefined
</script>

{#if error}
	<p>{error}</p>
{/if}

<style>
	p {
		color: var(--danger-active);
		font-size: 0.875rem;
		line-height: 20px;
	}
</style>

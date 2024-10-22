<script lang="ts">
	export let direction: 'horizontal' | 'vertical' = 'horizontal'
</script>

<div class={direction} />

<style>
	div {
		background-color: var(--secondary-dk);
	}

	.horizontal {
		width: 100%;
		height: 1px;
	}

	.vertical {
		width: 1px;
		height: 100%;
	}
</style>

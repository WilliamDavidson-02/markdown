<script lang="ts">
	import { getDaysDifference } from '$lib/utilts/date'

	export let date: string

	import { onMount } from 'svelte'

	let label = ''

	onMount(() => {
		const diffDays = getDaysDifference(new Date(date))
		const daysSinceNewYear = getDaysDifference(new Date(`${new Date().getFullYear()}-01-01`))

		if (diffDays === 0) {
			label = 'Today'
		} else if (diffDays <= 7) {
			label = 'Previous 7 days'
		} else if (diffDays <= 30) {
			label = 'Previous 30 days'
		} else if (diffDays <= daysSinceNewYear) {
			// prettier-ignore
			const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
			label = months[new Date(date).getMonth()]
		} else {
			label = new Date(date).toLocaleDateString('en-US', { year: 'numeric' })
		}
	})
</script>

<p>{label}</p>

<style>
	p {
		font-size: 14px;
		font-weight: 500;
		line-height: 24px;
		color: var(--foreground-md);
		background-color: var(--base);
		position: sticky;
		top: 0;
		z-index: 1;
	}
</style>

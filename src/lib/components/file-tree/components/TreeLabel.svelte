<script lang="ts">
	export let date: string

	import { onMount } from 'svelte'

	let label = ''

	onMount(() => {
		const now = new Date()
		const inputDate = new Date(date)
		const diffTime = Math.abs(now.getTime() - inputDate.getTime())
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 0) {
			label = 'Today'
		} else if (diffDays <= 7) {
			label = 'Previous 7 days'
		} else if (diffDays <= 30) {
			label = 'Previous 30 days'
		} else {
			// prettier-ignore
			const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
			label = months[inputDate.getMonth()]
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

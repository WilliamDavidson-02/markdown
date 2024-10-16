<script>
	import { Editor } from '$lib/components/editor'
	import { goto } from '$app/navigation'

	export let data
	let loading = false

	const signOut = async () => {
		loading = true
		const res = await fetch('/sign-out', { method: 'POST' })
		if (res.ok) goto('/login')
		loading = false
	}

	console.log(data)
</script>

{#if data.user}
	<button on:click={signOut} disabled={loading}>{loading ? 'Signing out...' : 'Sign Out'}</button>
{:else}
	<a href="/login">Login</a>
{/if}
<Editor />

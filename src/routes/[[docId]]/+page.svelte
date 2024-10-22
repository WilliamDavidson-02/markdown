<script>
	import { Button } from '$lib/components/button'
	import { Editor } from '$lib/components/editor'
	import { Nav } from '$lib/components/nav'

	export let data
</script>

{#if data.user}
	<main>
		<Nav />
		<Editor />
	</main>
{:else}
	<main class="guest">
		<header>
			<img src="/logo_icon.svg" alt="Markdown" />
			<div class="nav-btns">
				<Button href="/login" variant="ghost">Login</Button>
				<Button href="/register">Create Account</Button>
			</div>
		</header>
		<section>
			<h1>Markdown</h1>
		</section>
	</main>
{/if}

<style>
	main {
		display: flex;
		min-height: 100svh;
	}

	.guest {
		max-width: 1440px;
		margin: 0 auto;
		color: var(--foreground-dk);
		padding: var(--space-base);
		flex-direction: column;
	}

	.guest header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.guest header img {
		height: 39px;
	}

	.nav-btns {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.guest section {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media (min-width: 768px) {
		.guest {
			padding: var(--space-xl) var(--space-2xl);
		}
	}
</style>

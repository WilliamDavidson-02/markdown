<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Editor } from '$lib/components/editor'
	import { homePageDoc } from '$lib/homePageDoc'

	let editorElement: HTMLDivElement
</script>

<main>
	<header>
		<img src="/logo_icon.svg" alt="Markdown" />
		<div class="nav-btns">
			<Button href="/login" variant="ghost">Login</Button>
			<Button href="/register">Create Account</Button>
		</div>
	</header>
	<section>
		<h1>Markdown</h1>
		<Editor bind:editorElement class="home-page-editor" initDoc={homePageDoc} />
	</section>
</main>

<style>
	main {
		display: flex;
		max-height: 100svh;
		height: 100svh;
		max-width: 1440px;
		margin: 0 auto;
		color: var(--foreground-dk);
		padding: var(--space-base);
		flex-direction: column;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	header img {
		height: 39px;
	}

	.nav-btns {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4xl);
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	h1 {
		font-size: 4rem;
		font-weight: 600;
		background-image: linear-gradient(to left, #008fff, #96d1ff);
		color: transparent;
		background-clip: text;
		-webkit-background-clip: text;
	}

	:global(.home-page-editor) {
		width: 100%;
		height: 100%;
		max-width: 800px !important;
		max-height: 500px !important;
		border-radius: var(--border-radius-md);
		box-shadow: var(--shadow-overlay);
		border: 1px solid var(--secondary-dk);
		overflow: hidden;
	}

	@media (min-width: 768px) {
		main {
			padding: var(--space-xl) var(--space-2xl);
		}
	}

	@media (min-width: 1500px) {
		:global(.home-page-editor) {
			max-width: 1024px !important;
			max-height: 768px !important;
		}
	}
</style>

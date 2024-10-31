<script>
	import GithubIcon from '$lib/components/GithubIcon.svelte'
	import { Repeat, CirclePlus } from 'lucide-svelte'
	import { Button } from '$lib/components/button'
	import { PUBLIC_GITHUB_INSTALLATION_URL } from '$env/static/public'
</script>

<div class="wrapper">
	<div class="icons">
		<GithubIcon size={64} />
		<Repeat size={32} color="var(--foreground-md)" />
		<img src="/logo_icon.svg" alt="Markdown logo" />
	</div>
	<p>Connect your Github to create, edit and update your Github-hosted markdown files.</p>
	<Button href={PUBLIC_GITHUB_INSTALLATION_URL}>
		<CirclePlus size={16} stroke-width={1.5} />
		Connect new Github Org
	</Button>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4xl);
		height: 100%;
		background-color: var(--secondary);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--secondary-dk);
		box-shadow: var(--shadow-overlay);
	}

	.icons {
		display: flex;
		gap: var(--space-base);
		justify-content: center;
		align-items: center;
	}

	img {
		width: 64px;
		height: 64px;
		aspect-ratio: 1;
	}

	p {
		max-width: 80%;
		text-align: center;
	}
</style>

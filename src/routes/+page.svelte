<script lang="ts">
	import { Button } from '$lib/components/button'
	import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/command'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/popover'
	import { Check } from 'lucide-svelte'

	let selected = ''

	const items = [
		{
			label: 'Learning svelte',
			value: 'learning svelte'
		},
		{
			label: 'Learning typescript',
			value: 'learning typescript'
		},
		{
			label: 'Learning rust',
			value: 'learning rust'
		},
		{
			label: 'Learning python',
			value: 'learning python'
		}
	]
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
		<Popover>
			<PopoverTrigger>
				<Button>Open</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command label="Search for a topic">
					<CommandInput placeholder="Search..." autofocus />
					<CommandList>
						{#each items as item}
							<CommandItem
								value={item.value}
								onSelect={(currentValue) => (selected = currentValue)}
							>
								{item.label}
								{#if selected === item.value}
									<Check size={16} />
								{/if}
							</CommandItem>
						{/each}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	</section>
</main>

<style>
	main {
		display: flex;
		max-height: 100svh;
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
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media (min-width: 768px) {
		main {
			padding: var(--space-xl) var(--space-2xl);
		}
	}
</style>

<script lang="ts">
	import { getCtx, getState } from '../command'
	import type { CommandListProps } from '../index'

	type $$Props = CommandListProps

	let className: $$Props['class'] = ''
	export { className as class }

	const { ids } = getCtx()
	const state = getState()

	const sizerAction = (node: HTMLElement) => {
		let animationFrame: number
		const listEl = node.closest('[data-cmdk-list]')
		if (!listEl || !(listEl instanceof HTMLElement)) {
			return
		}

		const observer = new ResizeObserver(() => {
			animationFrame = requestAnimationFrame(() => {
				const height = node.offsetHeight
				listEl.style.setProperty('--cmdk-list-height', height.toFixed(1) + 'px')
			})
		})

		observer.observe(node)
		return {
			destroy() {
				cancelAnimationFrame(animationFrame)
				observer.unobserve(node)
			}
		}
	}

	const listAttrs = {
		'data-cmdk-list': '',
		role: 'listbox',
		'aria-label': 'Suggestions',
		id: ids.list,
		'aria-labelledby': ids.input
	}

	const sizerAttrs = {
		'data-cmdk-list-sizer': ''
	}
</script>

<div {...listAttrs} class={className} {...$$restProps}>
	<div {...sizerAttrs} use:sizerAction>
		{#key $state.search === ''}
			<slot />
		{/key}
	</div>
</div>

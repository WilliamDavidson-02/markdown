import type { Action } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { keybindingSchema } from '../schemas'
import { deleteKeybinding, findKeybinding, insertKeybinding, updateKeybinding } from '../queries'

export const keybindingAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(keybindingSchema))
	const userId = locals.user?.id

	if (!userId || !form.valid) return fail(400, { form })

	const existingKeybinding = await findKeybinding(form.data.name, userId)

	if (form.data.reset) {
		if (existingKeybinding) await deleteKeybinding(form.data.name, userId)
		return { form }
	}

	if (existingKeybinding) {
		await updateKeybinding({ ...form.data, userId })
	} else {
		await insertKeybinding({ ...form.data, userId })
	}

	return { form }
}

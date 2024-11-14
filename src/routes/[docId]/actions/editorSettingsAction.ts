import type { Action } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { editorSettingsSchema } from '../schemas'
import { updateEditorSettings } from '../queries'

export const editorSettingsAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(editorSettingsSchema))

	if (!locals.user || !form.valid) return fail(400, { form })

	await updateEditorSettings(locals.user.id, form.data)

	return { form }
}

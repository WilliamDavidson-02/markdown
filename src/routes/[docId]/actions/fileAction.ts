import type { Action } from '@sveltejs/kit'
import { fail } from 'sveltekit-superforms'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { insertNewFile } from '../queries'
import { fileSchema } from '../schemas'

export const fileAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(fileSchema))
	const userId = locals.user?.id

	// The page is protected, so there should always be a user but just in case there isn't
	if (!userId || !form.valid) return fail(400, { form })

	const fileData = { ...form.data, userId, name: form.data.name.trim() }
	const file = await insertNewFile(fileData)

	return { form, id: file[0].id }
}

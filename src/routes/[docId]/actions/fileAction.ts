import type { Action } from '@sveltejs/kit'
import { fail } from 'sveltekit-superforms'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { insertNewFile } from '../queries'
import { fileSchema } from '../schemas'
import { z } from 'zod'

export const fileAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(fileSchema))
	const userId = locals.user?.id

	if (!userId || !form.valid) return fail(400, { form })

	const fileData = { ...form.data, userId, name: form.data.name.trim() }
	const file = await insertNewFile(fileData, form.data.github)

	if (!z.string().uuid().safeParse(file).success) {
		return fail(500, { form, error: 'Failed to insert file' })
	}

	return { form, id: file }
}

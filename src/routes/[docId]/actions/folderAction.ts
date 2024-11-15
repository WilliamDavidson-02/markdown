import type { Action } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { fail } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { insertNewFolder } from '../queries'
import { folderSchema } from '../schemas'
import { z } from 'zod'

export const folderAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(folderSchema))
	const userId = locals.user?.id

	// The page is protected, so there should always be a user but just in case there isn't
	if (!userId || !form.valid) return fail(400, { form })

	const { name, parentId } = form.data

	const folderData = { userId, name: name.trim(), parentId }
	const folder = await insertNewFolder(folderData, form.data.github)

	if (!z.string().uuid().safeParse(folder).success) {
		return fail(500, { form, error: 'Failed to insert folder' })
	}

	return { form, id: folder }
}

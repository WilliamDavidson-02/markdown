import type { Action } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { fail } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { insertNewFolder } from '../queries'
import { folderSchema } from '../schemas'

export const folderAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(folderSchema))
	const userId = locals.user?.id

	// The page is protected, so there should always be a user but just in case there isn't
	if (!userId || !form.valid) return fail(400, { form })

	const { name, parentId } = form.data

	const folderData = { userId, name: name.trim(), parentId }
	const folder = await insertNewFolder(folderData)

	return { form, id: folder[0].id }
}

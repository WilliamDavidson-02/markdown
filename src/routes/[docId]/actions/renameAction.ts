import { zod } from 'sveltekit-superforms/adapters'
import { renameSchema } from '../schemas'
import { fail, superValidate } from 'sveltekit-superforms'
import type { Action } from '@sveltejs/kit'
import { db } from '$lib/db'
import { fileTable, folderTable } from '$lib/db/schema'
import { and, eq } from 'drizzle-orm'

export const renameAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(renameSchema))

	const user = locals.user
	if (!user) return fail(401, { form })

	if (!form.valid) return fail(400, { form })

	const { id, name, type, icon, iconColor } = form.data

	if (type === 'file') {
		await db
			.update(fileTable)
			.set({ name, icon, iconColor })
			.where(and(eq(fileTable.id, id), eq(fileTable.userId, user.id)))
	} else {
		await db
			.update(folderTable)
			.set({ name })
			.where(and(eq(folderTable.id, id), eq(folderTable.userId, user.id)))
	}

	return { form }
}

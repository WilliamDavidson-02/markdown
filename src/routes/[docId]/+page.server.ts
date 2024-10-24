import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { fileIcons } from '$lib/fileIcons'
import { db } from '$lib/db'
import { fileTable, folderTable } from '$lib/db/schema.js'

const fileSchema = z.object({
	name: z.string().min(1, { message: 'File name is required' }).max(256, {
		message: 'Name must be at most 256 characters'
	}),
	icon: z
		.string()
		.refine((value) => fileIcons.map((icon) => icon.name).includes(value))
		.default(fileIcons[0].name),
	folderId: z.string().uuid().optional()
})

const folderSchema = z.object({
	name: z.string().max(256, { message: 'Name must be at most 256 characters' }),
	parentId: z.string().uuid().optional()
})

export const load = async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, `/`)
	}

	const fileForm = await superValidate(zod(fileSchema))
	const folderForm = await superValidate(zod(folderSchema))

	return {
		fileForm,
		folderForm,
		user: locals.user
	}
}

export const actions: Actions = {
	file: async ({ request, locals }) => {
		const form = await superValidate(request, zod(fileSchema))

		// The page is protected, so there should always be a user but just in case there isn't
		if (!locals.user || !form.valid) return fail(400, { form })

		const { icon, name, folderId } = form.data

		const file = await db
			.insert(fileTable)
			.values({
				userId: locals.user.id,
				icon,
				name: name.trim(),
				folderId
			})
			.returning({ id: fileTable.id })

		return { form, id: file[0].id }
	},
	folder: async ({ request, locals }) => {
		const form = await superValidate(request, zod(folderSchema))

		// The page is protected, so there should always be a user but just in case there isn't
		if (!locals.user || !form.valid) return fail(400, { form })

		const { name, parentId } = form.data

		const folder = await db
			.insert(folderTable)
			.values({
				userId: locals.user.id,
				name: name.trim(),
				parentId
			})
			.returning({ id: folderTable.id })

		return { form, id: folder[0].id }
	}
}

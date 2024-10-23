import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { redirect, type Actions } from '@sveltejs/kit'
import { fileIcons } from '$lib/fileIcons'

const fileSchema = z.object({
	name: z.string().max(256, { message: 'Name must be at most 256 characters' }),
	icon: z.enum(fileIcons.map((icon) => icon.name) as [string, ...string[]]).default('File'),
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
	file: async ({ request }) => {
		const form = await superValidate(request, zod(fileSchema))
		console.log(form)
		return { form }
	},
	folder: async ({ request }) => {
		const form = await superValidate(request, zod(folderSchema))
		console.log(form)
		return { form }
	}
}

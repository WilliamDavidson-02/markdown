import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { fileIcons } from '$lib/fileIcons'
import { db } from '$lib/db'
import { fileTable, folderTable } from '$lib/db/schema.js'
import { and, desc, eq } from 'drizzle-orm'
import { buildTree, sortTreeByDate } from '$lib/utilts/tree'

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

const getCurrentDocById = async (userId: string, docId: string) => {
	return await db
		.select()
		.from(fileTable)
		.where(and(eq(fileTable.id, docId), eq(fileTable.userId, userId)))
		.limit(1)
}

const getupdatedAtDoc = async (userId: string) => {
	return await db
		.select()
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.orderBy(desc(fileTable.updatedAt))
		.limit(1)
}

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		return redirect(302, `/`)
	}

	let currentDoc: (typeof fileTable.$inferSelect)[] | null = null
	const { docId } = params
	const userId = locals.user.id

	// Get the current doc
	if (docId && z.string().uuid().safeParse(docId).success) {
		currentDoc = await getCurrentDocById(userId, docId)
	} else {
		currentDoc = await getupdatedAtDoc(userId)
	}

	const folders = await db.select().from(folderTable).where(eq(folderTable.userId, userId))
	const files = await db
		.select()
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.orderBy(desc(fileTable.updatedAt))

	const folderTree = buildTree(folders, files)

	const rootFiles = files.filter((file) => !file.folderId)
	const tree = sortTreeByDate([...folderTree, ...rootFiles])

	const fileForm = await superValidate(zod(fileSchema))
	const folderForm = await superValidate(zod(folderSchema))

	return {
		currentDoc: currentDoc && currentDoc.length > 0 ? currentDoc[0] : null,
		tree,
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

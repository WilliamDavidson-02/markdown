import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { fileIcons } from '$lib/fileIcons'
import { db } from '$lib/db'
import { fileTable, folderTable, trashTable } from '$lib/db/schema.js'
import { and, desc, eq, notInArray } from 'drizzle-orm'
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

const getCurrentDocById = async (userId: string, docId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(
			and(eq(fileTable.id, docId), eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds))
		)
		.limit(1)
}

const getupdatedAtDoc = async (userId: string, trashIds: string[]) => {
	return await db
		.select()
		.from(fileTable)
		.where(and(eq(fileTable.userId, userId), notInArray(fileTable.id, trashIds)))
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

	const trash = await db.select().from(trashTable).where(eq(trashTable.userId, userId))
	const trashIds = trash.map((t) => t.fileId).filter((id) => id !== null)

	// Get the current doc
	if (docId && z.string().uuid().safeParse(docId).success) {
		currentDoc = await getCurrentDocById(userId, docId, trashIds)
		if (!currentDoc || currentDoc.length === 0) {
			currentDoc = await getupdatedAtDoc(userId, trashIds)
		}
	} else {
		currentDoc = await getupdatedAtDoc(userId, trashIds)
	}

	let files = await db
		.select()
		.from(fileTable)
		.where(eq(fileTable.userId, userId))
		.orderBy(desc(fileTable.updatedAt))
	let folders = await db.select().from(folderTable).where(eq(folderTable.userId, userId))

	let trashedFiles: (typeof fileTable.$inferSelect)[] = []
	let trashedFolders: (typeof folderTable.$inferSelect)[] = []

	files = files.filter((file) => {
		if (trash.some((t) => t.fileId === file.id)) {
			trashedFiles.push(file)
			return false
		}
		return true
	})

	const hasFolderWithNonTrashedContent = (folderId: string): boolean => {
		return (
			folders.some(
				(f) =>
					f.parentId === folderId &&
					(!trash.some((t) => t.folderId === f.id) || hasFolderWithNonTrashedContent(f.id))
			) || files.some((f) => f.folderId === folderId)
		)
	}

	folders = folders.filter((folder) => {
		const folderInTrash = trash.some((t) => t.folderId === folder.id)
		const folderHasNonTrashedContent = hasFolderWithNonTrashedContent(folder.id)

		if (folderInTrash && folderHasNonTrashedContent) {
			trashedFolders.push(folder)
			return true
		} else if (folderInTrash) {
			trashedFolders.push(folder)
			return false
		}
		return true
	})

	const builtTree = buildTree(folders, files)
	const builtTrashedTree = buildTree(trashedFolders, trashedFiles)

	const rootFiles = files.filter((file) => !file.folderId)
	const tree = sortTreeByDate([...builtTree, ...rootFiles])

	const rootTrashedFiles = trashedFiles.filter(
		(file) => !file.folderId || !trashedFolders.some((f) => f.id === file.folderId)
	)
	const trashedTree = [...builtTrashedTree, ...rootTrashedFiles]

	const fileForm = await superValidate(zod(fileSchema))
	const folderForm = await superValidate(zod(folderSchema))

	return {
		currentDoc: currentDoc && currentDoc.length > 0 ? currentDoc[0] : null,
		tree,
		fileForm,
		folderForm,
		user: locals.user,
		trashedTree
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

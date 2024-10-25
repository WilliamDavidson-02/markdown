import { db } from '$lib/db/index.js'
import { fileTable } from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { fileIcons } from '$lib/fileIcons'

const fileSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(256),
	icon: z.string().refine((value) => fileIcons.map((icon) => icon.name).includes(value)),
	doc: z.string().optional(),
	folderId: z.string().uuid().optional(),
	createdAt: z.date(),
	updatedAt: z.date()
})

export const PUT = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		let { file } = (await request.json()) as { file: z.infer<typeof fileSchema> }

		file.updatedAt = new Date(file.updatedAt)
		file.createdAt = new Date(file.createdAt)

		if (!fileSchema.safeParse(file).success) {
			return json({ error: 'Invalid file' }, { status: 400 })
		}

		await db
			.update(fileTable)
			.set({
				...file,
				updatedAt: new Date()
			})
			.where(and(eq(fileTable.id, file.id), eq(fileTable.userId, locals.user.id)))

		return json({ success: true }, { status: 200 })
	} catch {
		return json({ error: 'Failed to save document' }, { status: 500 })
	}
}

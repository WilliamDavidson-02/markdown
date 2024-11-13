import { db } from '$lib/db/index.js'
import { fileTable, folderTable } from '$lib/db/schema'
import { json } from '@sveltejs/kit'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const moveToSchema = z.object({
	target: z.object({
		id: z.string().uuid(),
		type: z.enum(['folder', 'file'])
	}),
	movingTo: z.string().uuid()
})

export const PATCH = async ({ request, locals }) => {
	const user = locals.user
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { target, movingTo }: z.infer<typeof moveToSchema> = await request.json()

	const { error } = moveToSchema.safeParse({ target, movingTo })
	if (error) {
		return json({ error: 'Invalid request' }, { status: 400 })
	}

	if (target.type === 'folder') {
		const folders = await db
			.select()
			.from(folderTable)
			.where(and(inArray(folderTable.id, [target.id, movingTo]), eq(folderTable.userId, user.id)))

		if (folders.length !== 2) {
			return json({ error: 'Invalid request' }, { status: 400 })
		}

		await db.update(folderTable).set({ parentId: movingTo }).where(eq(folderTable.id, target.id))
	} else {
		const folder = await db.select().from(folderTable).where(eq(folderTable.id, movingTo))
		const file = await db.select().from(fileTable).where(eq(fileTable.id, target.id))

		if (folder.length !== 1 || file.length !== 1) {
			return json({ error: 'Invalid request' }, { status: 400 })
		}

		await db.update(fileTable).set({ folderId: movingTo }).where(eq(fileTable.id, target.id))
	}

	return json({ success: true })
}

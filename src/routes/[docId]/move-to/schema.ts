import { z } from 'zod'

const itemSchema = z.object({
	id: z.string().uuid(),
	path: z.string()
})

export const moveToSchema = z.object({
	target: z.object({
		id: z.string().uuid(),
		type: z.enum(['folder', 'file']),
		children: z.object({
			folderIds: z.array(itemSchema),
			fileIds: z.array(itemSchema)
		})
	}),
	movingTo: z.object({
		id: z.string().uuid().nullable(),
		path: z.string().nullable()
	}),
	github: z.boolean()
})

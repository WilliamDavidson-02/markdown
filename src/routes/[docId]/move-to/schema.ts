import { z } from 'zod'

export const moveToSchema = z.object({
	target: z.object({
		id: z.string().uuid(),
		type: z.enum(['folder', 'file']),
		children: z.object({
			folderIds: z.array(z.string().uuid()),
			fileIds: z.array(
				z.object({
					id: z.string().uuid(),
					path: z.string()
				})
			)
		})
	}),
	movingTo: z.object({
		id: z.string().uuid(),
		path: z.string()
	}),
	github: z.boolean()
})

import { z } from 'zod'

export const pullRequestSchema = z.object({
	rootFolder: z.object({
		name: z.string(),
		id: z.string().uuid()
	}),
	target: z.object({
		id: z.string().uuid(),
		path: z.string()
	}),
	folderIds: z.array(z.string().uuid()),
	fileIds: z.array(z.string().uuid())
})

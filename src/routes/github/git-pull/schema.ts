import { z } from 'zod'

export const pullRequestSchema = z.object({
	rootFolder: z.object({
		name: z.string(),
		id: z.string().uuid()
	}),
	folderIds: z.array(z.string().uuid()),
	fileIds: z.array(z.string().uuid())
})

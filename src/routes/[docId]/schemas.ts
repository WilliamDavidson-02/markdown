import { z } from 'zod'
import { fileIcons } from '$lib/fileIcons'

export const fileSchema = z.object({
	name: z.string().min(1, { message: 'File name is required' }).max(256, {
		message: 'Name must be at most 256 characters'
	}),
	icon: z
		.string()
		.refine((value) => fileIcons.map((icon) => icon.name).includes(value))
		.default(fileIcons[0].name),
	folderId: z.string().uuid().optional()
})

export const folderSchema = z.object({
	name: z.string().max(256, { message: 'Name must be at most 256 characters' }),
	parentId: z.string().uuid().optional()
})

export const repositorySchema = z.object({
	id: z.number(),
	name: z.string(),
	full_name: z.string(),
	html_url: z.string()
})

export const repositoriesSchema = z.object({
	installations: z
		.array(
			z.object({
				repositories: z.array(repositorySchema).default([]),
				removedRepositories: z.array(z.number()).default([]),
				installationId: z.number().optional()
			})
		)
		.default([])
})
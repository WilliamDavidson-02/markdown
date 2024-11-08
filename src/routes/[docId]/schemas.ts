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

export const repositoryBranchesSchema = z.object({
	commitMessage: z.string().min(1, { message: 'Commit message is required' }),
	branch: z.string().min(1, { message: 'Branch is required' }),
	createPullRequest: z.boolean().default(false),
	prTitle: z.string(),
	prDescription: z.string(),
	owner: z.string(),
	repo: z.string(),
	selectedItem: z.object({
		id: z.string(),
		name: z.string(),
		type: z.enum(['file', 'folder']),
		childIds: z.array(z.string()).optional()
	})
})

export const passwordResetSchema = z.object({
	currentPassword: z.string().min(8, { message: 'Current password is required' }),
	newPassword: z.string().min(8, { message: 'New password is required' })
})

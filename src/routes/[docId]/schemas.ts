import { z } from 'zod'
import { fileIcons, iconColors } from '$lib/fileIcons'

export const fileSchema = z.object({
	name: z.string().min(1, { message: 'File name is required' }).max(256, {
		message: 'Name must be at most 256 characters'
	}),
	icon: z
		.string()
		.refine((value) => fileIcons.map((icon) => icon.name).includes(value))
		.default(fileIcons[0].name),
	iconColor: z
		.string()
		.refine((value) => iconColors.map(({ color }) => color).includes(value))
		.default(iconColors[0].color),
	folderId: z.string().uuid().optional(),
	github: z.boolean().optional()
})

export const folderSchema = z.object({
	name: z.string().min(1, { message: 'Name is required' }).max(256, {
		message: 'Name must be at most 256 characters'
	}),
	parentId: z.string().uuid().optional(),
	github: z.boolean().optional()
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

export const emailSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' })
})

export const editorSettingsSchema = z.object({
	fontSize: z.number().min(1, { message: 'Font size must be at least 1' }),
	tabSize: z.number().min(1, { message: 'Tab size must be at least 1' }),
	wordWrap: z.boolean(),
	autoSave: z.boolean()
})

export const keybindingSchema = z.object({
	key: z.string(),
	name: z.string(),
	reset: z.boolean().default(false)
})

export const renameSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(256),
	icon: z.string().optional(),
	iconColor: z.string().optional(),
	type: z.enum(['file', 'folder']),
	github: z.boolean(),
	children: z
		.object({
			fileIds: z.array(z.string().uuid()),
			folderIds: z.array(z.string().uuid())
		})
		.optional()
})

import type { githubInstallationTable } from '$lib/db/schema'
import type { GitHubRepository } from '$lib/utilts/github'
import type { ComponentType } from 'svelte'
import type { SuperValidated } from 'sveltekit-superforms'
import type { z } from 'zod'
import type {
	emailSchema,
	passwordResetSchema,
	repositoriesSchema
} from '../../../routes/[docId]/schemas'
import type { User } from 'lucia'

export type SettingsSelected = 'Account' | 'Editor' | 'General' | 'Shortcut keys' | 'Connections'
export type SettingsItem = {
	icon: ComponentType
	label: SettingsSelected
}

export type AvailableRepositories = {
	id: number
	repositories: GitHubRepository[]
}

export type SettingsContext = {
	installations: (typeof githubInstallationTable.$inferSelect)[]
	availableRepositories: AvailableRepositories[]
	repositoriesForm: SuperValidated<z.infer<typeof repositoriesSchema>>
	passwordResetForm: SuperValidated<z.infer<typeof passwordResetSchema>>
	emailForm: SuperValidated<z.infer<typeof emailSchema>>
	user: User
}

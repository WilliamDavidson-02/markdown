import type { githubInstallationTable } from '$lib/db/schema'
import type { GitHubRepository } from '$lib/utilts/github'
import type { ComponentType } from 'svelte'
import type { SuperValidated } from 'sveltekit-superforms'
import type { z } from 'zod'
import type {
	editorSettingsSchema,
	emailSchema,
	passwordResetSchema,
	repositoriesSchema
} from '../../../routes/[docId]/schemas'
import type { User } from 'lucia'
import type { defaultEditorSettings } from './defaultSettings'
import type { KeyBinding } from '@codemirror/view'

export type SettingsSelected = 'Account' | 'Editor' | 'Shortcut keys' | 'Connections'
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
	editorSettings: typeof defaultEditorSettings
	editorSettingsForm: SuperValidated<z.infer<typeof editorSettingsSchema>>
	editorKeymaps: KeyBinding[]
}

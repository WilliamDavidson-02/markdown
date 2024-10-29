import type { githubInstallationTable } from '$lib/db/schema'
import type { ComponentType } from 'svelte'

export type SettingsSelected = 'Account' | 'Editor' | 'General' | 'Shortcut keys' | 'Connections'
export type SettingsItem = {
	icon: ComponentType
	label: SettingsSelected
}

export type SettingsContext = {
	installations: (typeof githubInstallationTable.$inferSelect)[]
}

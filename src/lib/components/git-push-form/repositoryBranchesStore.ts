import { writable } from 'svelte/store'
import type { z } from 'zod'
import type { repositoryBranchesSchema } from '../../../routes/[docId]/schemas'
import type { SuperValidated } from 'sveltekit-superforms'

export type RepositoryBranchesForm = SuperValidated<z.infer<typeof repositoryBranchesSchema>>
export const repositoryBranchesFormStore = writable<RepositoryBranchesForm | null>(null)

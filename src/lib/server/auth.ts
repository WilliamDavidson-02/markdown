import { Lucia } from 'lucia'
import { dev } from '$app/environment'
import { db } from '$lib/db'
import { sessionTable, userTable } from '$lib/db/schema'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { GitHub } from 'arctic'
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private'

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => ({
		email: attributes.email,
		githubId: attributes.githubId
	})
})

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia
		DatabaseUserAttributes: {
			email: string
			githubId: number
		}
	}
}

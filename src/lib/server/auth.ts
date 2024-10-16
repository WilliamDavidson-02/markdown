// src/lib/server/auth.ts
import { Lucia } from 'lucia'
import { dev } from '$app/environment'
import { db } from '$lib/db'
import { sessionTable, userTable } from '$lib/db/schema'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => ({ email: attributes.email })
})

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia
		DatabaseUserAttributes: {
			email: string
		}
	}
}

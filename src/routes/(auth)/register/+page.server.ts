import type { Actions } from './$types'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { generateIdFromEntropySize } from 'lucia'
import { hash } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import { lucia } from '$lib/server/auth'
import { settingsTable, userTable } from '$lib/db/schema'
import { eq } from 'drizzle-orm'
import { db, dbPool } from '$lib/db'

const emailAndPasswordSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 characters' })
		.max(256, { message: 'Password must be at most 256 characters' })
})

export const load = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/')
	}
	const form = await superValidate(zod(emailAndPasswordSchema))
	return { form }
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(emailAndPasswordSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		const passwordHash = await hash(form.data.password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		})
		const userId = generateIdFromEntropySize(10)
		const email = form.data.email.trim().toLowerCase()

		// Check if user already exists
		const user = await db.$count(userTable, eq(userTable.email, email))
		if (user > 0) {
			return fail(400, { form, error: 'User already exists' })
		}

		try {
			await dbPool.transaction(async (tx) => {
				await tx.insert(userTable).values({
					id: userId,
					email,
					passwordHash
				})

				await tx.insert(settingsTable).values({ userId })
			})
		} catch {
			return fail(500, { form, error: 'Failed to create user' })
		}

		const session = await lucia.createSession(userId, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		})

		throw redirect(302, '/')
	}
}

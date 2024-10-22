import type { Actions } from './$types'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'
import { verify } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import { lucia } from '$lib/server/auth'
import { userTable } from '$lib/db/schema'
import { eq } from 'drizzle-orm'
import { db } from '$lib/db'

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

		const email = form.data.email.trim().toLowerCase()
		const existingUser = await db
			.select()
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1)

		if (existingUser.length === 0) {
			return fail(400, { form, error: 'Incorrect email or password' })
		}

		const user = existingUser[0]

		const validPassword = await verify(user.passwordHash ?? '', form.data.password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		})
		if (!validPassword) {
			return fail(400, {
				form,
				error: 'Incorrect email or password'
			})
		}

		const session = await lucia.createSession(user.id, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		})

		throw redirect(302, '/')
	}
}

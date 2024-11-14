import type { Action } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { passwordResetSchema } from '../schemas'
import { getUserByEmail, updateUserPassword } from '../queries'
import { hash, verify } from '@node-rs/argon2'

export const passwordResetAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(passwordResetSchema))

	if (!locals.user || !form.valid) return fail(400, { form })
	const { currentPassword, newPassword } = form.data

	const existingUser = await getUserByEmail(locals.user.email)
	if (existingUser.length === 0) return fail(400, { form })

	const user = existingUser[0]
	const validPassword = await verify(user.passwordHash ?? '', currentPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})
	if (!validPassword) {
		return fail(400, { form, error: 'Incorrect password' })
	}
	if (newPassword === currentPassword) {
		return fail(400, {
			form,
			error: 'New password cannot be the same as the current password'
		})
	}

	const newPasswordHash = await hash(newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	await updateUserPassword(user.id, newPasswordHash)

	return { form }
}

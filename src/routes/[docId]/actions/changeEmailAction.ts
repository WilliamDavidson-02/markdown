import type { Action } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { emailSchema } from '../schemas'
import { getUserByEmail, updateUserEmail } from '../queries'

export const changeEmailAction: Action = async ({ request, locals }) => {
	const form = await superValidate(request, zod(emailSchema))

	if (!locals.user || !form.valid) return fail(400, { form })

	const email = form.data.email.trim().toLowerCase()
	if (email === locals.user.email) return fail(400, { form, error: 'Email unchanged' })

	const existingUser = await getUserByEmail(email)
	if (existingUser.length > 0) return fail(400, { form, error: 'Email unavailable' })

	await updateUserEmail(locals.user.id, email)

	return { form }
}

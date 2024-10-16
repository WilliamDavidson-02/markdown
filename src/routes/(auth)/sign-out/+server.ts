import { json } from '@sveltejs/kit'
import { lucia } from '$lib/server/auth'

export const POST = async (event) => {
	if (!event.locals.session) {
		return json({ error: 'No session' }, { status: 401 })
	}

	await lucia.invalidateSession(event.locals.session.id)
	const sessionCookie = lucia.createBlankSessionCookie()
	event.cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	})

	return json({ success: true })
}

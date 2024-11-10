import { OAuth2RequestError } from 'arctic'
import { generateIdFromEntropySize } from 'lucia'
import { github, lucia } from '$lib/server/auth'

import type { RequestEvent } from '@sveltejs/kit'
import { db } from '$lib/db'
import { userTable } from '$lib/db/schema'
import { eq } from 'drizzle-orm'

export const GET = async (event: RequestEvent): Promise<Response> => {
	const code = event.url.searchParams.get('code')
	const state = event.url.searchParams.get('state')
	const storedState = event.cookies.get('github_oauth_state') ?? null

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		})
	}

	try {
		const tokens = await github.validateAuthorizationCode(code)
		const githubUserResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		})
		const githubUser: GitHubUser = await githubUserResponse.json()

		const existingUser = await db
			.select()
			.from(userTable)
			.where(eq(userTable.githubId, githubUser.id))
			.limit(1)

		if (existingUser.length > 0) {
			const session = await lucia.createSession(existingUser[0].id, {})
			const sessionCookie = lucia.createSessionCookie(session.id)
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			})
		} else {
			const userId = generateIdFromEntropySize(10)

			await db.insert(userTable).values({
				id: userId,
				githubId: githubUser.id
			})

			const session = await lucia.createSession(userId, {})
			const sessionCookie = lucia.createSessionCookie(session.id)
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			})
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		})
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			})
		}
		return new Response(null, {
			status: 500
		})
	}
}

interface GitHubUser {
	id: number
	login: string
}

import { redirect } from '@sveltejs/kit'
import type { RequestEvent } from '../$types'
import { generateGitHubJWT } from '$lib/utilts/github'
import { githubInstallationTable } from '$lib/db/schema'
import { db } from '$lib/db'

export const GET = async (event: RequestEvent) => {
	const installationId = event.url.searchParams.get('installation_id')
	const userId = event.locals.user?.id

	if (!userId) return redirect(302, '/login')

	if (installationId) {
		try {
			const jwtToken = generateGitHubJWT()

			const response = await fetch(`https://api.github.com/app/installations/${installationId}`, {
				headers: {
					Authorization: `Bearer ${jwtToken}`,
					Accept: 'application/vnd.github+json'
				}
			})

			if (!response.ok) throw Error('Failed to connect to Github')

			const data = await response.json()
			const installation = {
				id: data.id,
				username: data.account.login,
				avatarUrl: data.account.avatar_url,
				userId
			} as typeof githubInstallationTable.$inferInsert

			await db.insert(githubInstallationTable).values(installation)
		} catch {
			throw Error('Failed to connect to Github')
		}
	}

	return redirect(302, '/')
}

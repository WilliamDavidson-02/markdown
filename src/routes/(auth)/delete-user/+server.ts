import { dbPool, db } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubInstallationTable,
	trashTable,
	sessionTable,
	userTable
} from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { deleteGithubInstallation, generateGitHubJWT } from '$lib/utilts/github.js'
import { lucia } from '$lib/server/auth.js'

export const DELETE = async ({ locals, cookies }) => {
	const userId = locals.user?.id
	if (!userId || !locals.session) return json({ error: 'Unauthorized' }, { status: 401 })

	const installationIds = (
		await db
			.select({ id: githubInstallationTable.id })
			.from(githubInstallationTable)
			.where(eq(githubInstallationTable.userId, userId))
	).map((i) => i.id)

	await dbPool.transaction(async (tx) => {
		await tx.delete(fileTable).where(eq(fileTable.userId, userId))
		await tx.delete(folderTable).where(eq(folderTable.userId, userId))
		// Github file and folder table is deleted on file and folder table cascade
		await tx.delete(trashTable).where(eq(trashTable.userId, userId))

		if (installationIds.length > 0) {
			await tx.delete(githubInstallationTable).where(eq(githubInstallationTable.userId, userId))
			// Github repository table is deleted on github installation table cascade
		}

		await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))
		await tx.delete(userTable).where(eq(userTable.id, userId))
	})

	// Uninstall all github installations
	if (installationIds.length > 0) {
		const token = generateGitHubJWT()
		await Promise.all(installationIds.map((id) => deleteGithubInstallation(id, token)))
	}

	// Clear cookie session
	const sessionCookie = lucia.createBlankSessionCookie()
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	})

	return json({ success: true })
}

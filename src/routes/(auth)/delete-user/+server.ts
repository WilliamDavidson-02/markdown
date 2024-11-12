import { dbPool, db } from '$lib/db'
import {
	fileTable,
	folderTable,
	githubInstallationTable,
	trashTable,
	sessionTable,
	userTable,
	githubFileTable,
	githubFolderTable,
	repositoryTable
} from '$lib/db/schema.js'
import { json } from '@sveltejs/kit'
import { eq, inArray } from 'drizzle-orm'
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

		await tx.delete(trashTable).where(eq(trashTable.userId, userId))

		if (installationIds.length > 0) {
			const deletedRepos = await tx
				.delete(repositoryTable)
				.where(eq(repositoryTable.userId, userId))
				.returning({ id: repositoryTable.id })

			const ids = deletedRepos.map((r) => r.id)
			await tx.delete(githubFileTable).where(inArray(githubFileTable.repositoryId, ids))
			await tx.delete(githubFolderTable).where(inArray(githubFolderTable.repositoryId, ids))

			await tx.delete(githubInstallationTable).where(eq(githubInstallationTable.userId, userId))
		}

		await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))
		await tx.delete(userTable).where(eq(userTable.id, userId))
	})

	// Uninstall all github installations
	if (installationIds.length > 0) {
		const token = generateGitHubJWT()
		await Promise.all(installationIds.map((id) => deleteGithubInstallation(id, token)))
	}

	const sessionCookie = lucia.createBlankSessionCookie()
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	})

	return json({ success: true })
}

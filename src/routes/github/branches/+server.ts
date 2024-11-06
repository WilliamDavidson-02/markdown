import { listAllBranches } from '$lib/utilts/github'
import { json } from '@sveltejs/kit'

export const GET = async ({ locals, url }) => {
	const userId = locals.user?.id
	if (!userId) return json({ error: 'Unauthorized' }, { status: 401 })

	const owner = url.searchParams.get('owner')
	const repo = url.searchParams.get('repo')
	const installationId = Number(url.searchParams.get('installationId'))

	if (!owner || !repo || !installationId) {
		return json({ error: 'Missing parameters' }, { status: 400 })
	}

	const branches = await listAllBranches(`${owner}/${repo}`, installationId)

	return json({ branches })
}

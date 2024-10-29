import { GITHUB_APP_ID, GITHUB_PRIVATE_KEY } from '$env/static/private'
import jwt from 'jsonwebtoken'

export const generateGitHubJWT = () => {
	const privateKey = GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n')

	const now = Math.floor(Date.now() / 1000)
	const payload = {
		iat: now,
		exp: now + 10 * 60,
		iss: GITHUB_APP_ID
	}

	return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}

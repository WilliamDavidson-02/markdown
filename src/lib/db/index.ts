import { NEON_DB_URL } from '$env/static/private'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const client = neon(NEON_DB_URL)
export const db = drizzle(client, { schema })

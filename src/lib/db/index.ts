import { NEON_DB_URL, NEON_DB_URL_POOL } from '$env/static/private'
import { neon, neonConfig, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
const pool = new Pool({ connectionString: NEON_DB_URL_POOL })
export const dbPool = drizzleServerless(pool, { schema })

const client = neon(NEON_DB_URL)
export const db = drizzle(client, { schema })

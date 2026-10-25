import { Pool } from 'pg'
import { getMigrations } from 'better-auth/db/migration'
import { loadEnv } from 'vite'
import { authUserFields } from '../src/server/auth/schema.mjs'

const env = {
  ...loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''),
  ...process.env
}
if (env.AUTH_MODE !== 'database' || !env.AUTH_DATABASE_URL) {
  throw new Error(
    'Set AUTH_MODE=database and AUTH_DATABASE_URL before running auth migrations.'
  )
}
const database = new Pool({
  connectionString: env.AUTH_DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 8000
})
try {
  const migration = await getMigrations({
    database,
    user: { additionalFields: authUserFields }
  })
  await migration.runMigrations()
  console.log('Better Auth database migration completed.')
} finally {
  await database.end()
}

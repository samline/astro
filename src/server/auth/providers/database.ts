import { Pool } from 'pg'
import { createAuthService, type CommonOptions } from '../factory'
import { nativeOptions } from '../config'

export default (
  read: (key: string) => string | undefined,
  common: CommonOptions
) => {
  const connectionString = read('AUTH_DATABASE_URL')
  if (!connectionString)
    throw new Error('Configure AUTH_DATABASE_URL for database authentication.')
  return createAuthService({
    ...common,
    mode: 'database',
    native: nativeOptions,
    database: new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000
    })
  })
}

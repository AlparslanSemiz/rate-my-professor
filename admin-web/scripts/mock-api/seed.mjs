import { fileURLToPath } from 'node:url'
import { closePool, withTransaction } from './db.mjs'
import { createSchema } from './schema.mjs'
import { seedAll } from './seed-data.mjs'

export async function resetMockDatabase() {
  await withTransaction(async (client) => {
    await createSchema(client)
    await client.query(`
      TRUNCATE
        mock_activity_logs,
        mock_audit_logs,
        mock_bug_reports,
        mock_comment_reports,
        mock_warnings,
        mock_login_codes,
        mock_tokens,
        mock_users
      CASCADE
    `)
    await seedAll(client)
  })
}

export async function ensureMockDatabase() {
  await withTransaction(async (client) => {
    await createSchema(client)
    const { rows } = await client.query('SELECT count(*)::int AS count FROM mock_users')
    if (rows[0].count === 0) {
      await seedAll(client)
    }
  })
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  resetMockDatabase()
    .then(() => {
      console.log('Mock database seeded.')
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(closePool)
}

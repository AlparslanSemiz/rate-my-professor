import http from 'node:http'
import { apiConfig, demoLoginCode } from './config.mjs'
import { closePool } from './db.mjs'
import { route } from './router.mjs'
import { ensureMockDatabase } from './seed.mjs'

try {
  await ensureMockDatabase()
} catch (error) {
  console.error('Could not connect to the mock database. Is it running? Try `npm run db:up`.')
  console.error(error)
  await closePool()
  process.exit(1)
}

const server = http.createServer(route)

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Mock API port ${apiConfig.port} is already in use. Stop the other backend or set MOCK_API_PORT.`,
    )
  } else {
    console.error(error)
  }
  process.exit(1)
})

server.listen(apiConfig.port, () => {
  console.log(`Mock API listening on http://localhost:${apiConfig.port}`)
  console.log(`Demo admin: u-kisi4@student.kit.edu / ${demoLoginCode}`)
})

async function shutdown() {
  server.close()
  await closePool()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

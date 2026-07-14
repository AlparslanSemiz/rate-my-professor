import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()

function readEnvFile(fileName) {
  const filePath = path.join(rootDir, fileName)
  if (!fs.existsSync(filePath)) return {}

  const entries = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...valueParts] = trimmed.split('=')
    entries[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
  return entries
}

const dockerEnv = readEnvFile('.env.docker')

function setting(name, fallback) {
  return process.env[name] ?? dockerEnv[name] ?? fallback
}

export const dbConfig = {
  host: setting('LOCAL_DB_HOST', 'localhost'),
  port: Number(setting('LOCAL_DB_PORT', '5432')),
  database: setting('LOCAL_DB_NAME', 'admin_web'),
  user: setting('LOCAL_DB_USER', 'admin_web'),
  password: setting('LOCAL_DB_PASSWORD', 'admin_web'),
}

export const apiConfig = {
  port: Number(setting('MOCK_API_PORT', '8080')),
}

export const demoLoginCode = setting('VITE_DEMO_LOGIN_CODE', '123456')
export const demoAdminToken = setting('VITE_DEMO_ADMIN_TOKEN', 'dev-admin-token')

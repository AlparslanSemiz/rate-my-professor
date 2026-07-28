import { iso, isUuid } from './http.mjs'

export function encodeAuditCursor(row) {
  return Buffer.from(JSON.stringify({ createdAt: iso(row.created_at), id: row.id })).toString(
    'base64url',
  )
}

export function decodeAuditCursor(value) {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!isUuid(parsed.id) || Number.isNaN(new Date(parsed.createdAt).getTime())) return null
    return parsed
  } catch {
    return null
  }
}

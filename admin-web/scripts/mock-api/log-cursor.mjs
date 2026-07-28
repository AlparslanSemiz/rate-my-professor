import { iso, isUuid } from './http.mjs'

/**
 * Keyset cursor shared by the audit and activity log endpoints. Both tables page on
 * (created_at, id) descending, so one encoder serves both.
 */
export function encodeLogCursor(row) {
  return Buffer.from(JSON.stringify({ createdAt: iso(row.created_at), id: row.id })).toString(
    'base64url',
  )
}

export function decodeLogCursor(value) {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!isUuid(parsed.id) || Number.isNaN(new Date(parsed.createdAt).getTime())) return null
    return parsed
  } catch {
    return null
  }
}

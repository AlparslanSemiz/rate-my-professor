import type { AuthUser, SessionUserPayload } from './authTypes'

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function toAuthUser(payload: SessionUserPayload | undefined): AuthUser | undefined {
  if (!payload) return undefined

  const id = readString(payload.id).trim()
  if (!id) return undefined

  return {
    id,
    name: readString(payload.username) || readString(payload.name),
    email: readString(payload.kitEmail) || readString(payload.email),
    role: readString(payload.role),
    isSuperAdmin: payload.isSuperAdmin === true,
  }
}

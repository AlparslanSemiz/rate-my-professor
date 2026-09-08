import type { BasicResponse } from './ApiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  isSuperAdmin?: boolean
}

export interface LoginResponse extends BasicResponse {
  authToken: string
}

export interface SessionUserPayload {
  id?: unknown
  username?: unknown
  name?: unknown
  kitEmail?: unknown
  email?: unknown
  role?: unknown
  isSuperAdmin?: unknown
}

export interface SessionPayload extends BasicResponse {
  user?: SessionUserPayload
}

export interface SessionResponse extends BasicResponse {
  user?: AuthUser
}

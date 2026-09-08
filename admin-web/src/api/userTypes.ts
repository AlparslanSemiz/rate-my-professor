import type { UserRole, UserStatus } from '../domain/user'

export type { UserRole, UserStatus }

export interface Warning {
  id: string | null
  userID: string
  message: string
  createdAt: string
  issuedBy: string
  issuedByName: string
}

export interface User {
  id: string
  username: string
  kitEmail: string
  role: UserRole
  status: UserStatus
  joined: string
  lastOnline: string
  biography: string
  warnings: number
  reports: number
  credibilityScore: number
}

export type UserSort = 'newest' | 'oldest'

export interface UserQuery {
  limit?: number
  cursor?: string | null
  q?: string
  status?: UserStatus
  role?: UserRole
  sort?: UserSort
}

export interface UserPage {
  users: User[]
  nextCursor: string | null
}

export interface UserUpdate {
  username?: string
  biography?: string
  status?: Extract<UserStatus, 'ACTIVE' | 'BLOCKED'>
  role?: UserRole
  credibilityScore?: number
}

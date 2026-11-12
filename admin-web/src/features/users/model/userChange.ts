import type { User } from '@/api/users'

/**
 * What a profile action changed, carrying the value the backend reported rather than leaving
 * the list to guess at it.
 */
export type UserChange =
  | { type: 'refreshed'; user: User }
  | { type: 'warnings-changed'; warnings: number }
  | { type: 'deleted' }

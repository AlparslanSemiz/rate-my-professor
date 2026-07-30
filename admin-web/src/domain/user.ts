export type UserRole = 'STUDENT' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED'

/** How a user is referenced from content and reports: enough to render a chip and open the profile. */
export interface UserReference {
  id: string
  name: string
  role: UserRole
  warnings: number
  status: UserStatus
}

import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { withRequiredAdminRole } from '../utils/adminAccess'
import type { UserRole, UserStatus } from '../domain/user'

export type { UserRole, UserStatus }

export interface Warning {
  /**
   * Address of the warning, needed to correct or withdraw it. The backend's warning history
   * does not carry it yet, so it is absent on every warning served today and the panel hides
   * the edit and withdraw controls when it is missing.
   */
  id: string | null
  userID: string
  message: string
  createdAt: string
  issuedBy: string
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
}

interface UserListResponse extends BasicResponse {
  users: User[]
}

interface WarningHistoryResponse extends BasicResponse {
  warnings: BackendWarning[]
}

interface BackendWarning {
  id?: string
  userID: string
  message: string
  createdAt: string
  createdFrom: { id: string; student?: unknown; createdAt: string } | null
}

function toWarning(w: BackendWarning): Warning {
  return {
    id: w.id ?? null,
    userID: w.userID,
    message: w.message,
    createdAt: w.createdAt,
    issuedBy: w.createdFrom?.id ?? 'Unknown',
  }
}

/**
 * Partial edit of a user. An omitted field is left alone and an empty body is rejected, so
 * only the fields that actually changed are sent. The panel does not offer `kitEmail` as an
 * editable field — it is the login identity, and changing it is not exposed here.
 *
 * `status` takes `ACTIVE` and `BLOCKED` only — deleting anonymizes the account, which is
 * `DELETE /users/{id}` and not a field edit. Demoting an admin revokes its sessions.
 */
export interface UserUpdate {
  username?: string
  biography?: string
  status?: Extract<UserStatus, 'ACTIVE' | 'BLOCKED'>
  role?: UserRole
  credibilityScore?: number
}

export class UsersService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<User[]> {
    const response = await this.client.get<UserListResponse>('/users')
    return response.users.map(withRequiredAdminRole)
  }

  async getById(id: string): Promise<User> {
    const user = await this.client.get<User>(`/users/${id}`)
    return withRequiredAdminRole(user)
  }

  update(id: string, update: UserUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/users/${id}`)
  }

  block(id: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}/block`)
  }

  unblock(id: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}/unblock`)
  }

  /**
   * The backend expects the issuing admin's id nested as `createdFrom.id` — it does not
   * derive this from the auth token. `adminId` should be the id of the currently logged-in
   * admin. `id`/`createdAt` are omitted: the backend generates both itself.
   */
  warn(id: string, message: string, adminId: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/users/${id}/warnings`, {
      userID: id,
      message,
      createdFrom: { id: adminId },
    })
  }

  async getWarnings(id: string): Promise<Warning[]> {
    const response = await this.client.get<WarningHistoryResponse>(`/users/${id}/warnings`)
    return response.warnings.map(toWarning)
  }

  /**
   * Corrects the text of a warning that was already issued. The student is not re-notified:
   * the notification went out when the warning was created, so rewording it corrects the
   * record rather than warning again.
   */
  updateWarning(id: string, warningId: string, message: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}/warnings/${warningId}`, { message })
  }

  /** Withdraws a warning that should not have been issued. */
  deleteWarning(id: string, warningId: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/users/${id}/warnings/${warningId}`)
  }
}

export const usersService = new UsersService(apiClient)

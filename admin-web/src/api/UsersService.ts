import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import { withRequiredAdminRole } from '../utils/adminAccess'
import type { UserRole, UserStatus } from '../domain/user'

export type { UserRole, UserStatus }

export interface Warning {
  /**
   * Address of the warning, needed to correct or withdraw it. Served since the 2026-08-20
   * release; the null case is kept only so an older deployment hides those controls instead
   * of offering an action with nothing to address.
   */
  id: string | null
  userID: string
  message: string
  createdAt: string
  /**
   * The issuing admin's **student** id — the same value `/auth/me` reports — so "did I issue
   * this?" is answered without a second lookup.
   */
  issuedBy: string
  /** The issuing admin as the operator knows them, for the history line. */
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
  /**
   * Optional because it is unconfirmed whether the backend serves it on the user reads: the
   * panel accepts `PATCH`-ing it, so it renders and seeds from it the moment it arrives.
   */
  credibilityScore?: number
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
  createdFrom: { id: string; name?: string; createdAt: string } | null
}

const UNKNOWN_ISSUER = 'Unknown'

function toWarning(w: BackendWarning): Warning {
  return {
    id: w.id ?? null,
    userID: w.userID,
    message: w.message,
    createdAt: w.createdAt,
    issuedBy: w.createdFrom?.id ?? '',
    issuedByName: w.createdFrom?.name?.trim() || UNKNOWN_ISSUER,
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
    return expectArray<User>(response, 'users', 'GET /users').map(withRequiredAdminRole)
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
   * The target comes from the path and the issuer from the auth token, so the body is the
   * message and nothing else. The panel used to send `userID` and `createdFrom` as well; the
   * backend ignored both, and still accepts them.
   */
  warn(id: string, message: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/users/${id}/warnings`, { message })
  }

  async getWarnings(id: string): Promise<Warning[]> {
    const response = await this.client.get<WarningHistoryResponse>(`/users/${id}/warnings`)
    return expectArray<BackendWarning>(response, 'warnings', 'GET /users/{id}/warnings').map(toWarning)
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

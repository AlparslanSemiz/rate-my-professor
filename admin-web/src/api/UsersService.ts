import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { withRequiredAdminRole } from '../utils/adminAccess'

export type UserRole = 'STUDENT' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED'

export interface Warning {
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
  userID: string
  message: string
  createdAt: string
  createdFrom: { id: string; student?: unknown; createdAt: string } | null
}

function toWarning(w: BackendWarning): Warning {
  return {
    userID: w.userID,
    message: w.message,
    createdAt: w.createdAt,
    issuedBy: w.createdFrom?.id ?? 'Unknown',
  }
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

  getById(id: string): Promise<User> {
    return this.client.get<User>(`/users/${id}`)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete(`/users/${id}`)
  }

  block(id: string): Promise<BasicResponse> {
    return this.client.withQueryParams('PATCH', `/users/${id}/block`, {})
  }

  unblock(id: string): Promise<BasicResponse> {
    return this.client.withQueryParams('PATCH', `/users/${id}/unblock`, {})
  }

  /**
   * The backend expects the issuing admin's id nested as `createdFrom.id` — it does not
   * derive this from the auth token. `adminId` should be the id of the currently logged-in
   * admin. `id`/`createdAt` are omitted: the backend generates both itself.
   */
  async warn(id: string, message: string, adminId: string): Promise<BasicResponse> {
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
}

export const usersService = new UsersService(apiClient)

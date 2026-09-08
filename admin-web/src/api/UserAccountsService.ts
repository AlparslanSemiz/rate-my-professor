import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { User, UserPage, UserQuery, UserUpdate } from './userTypes'
import { withRequiredAdminRole } from '../utils/adminAccess'

interface UserListResponse extends BasicResponse {
  users: User[]
  nextCursor?: string | null
}

export class UserAccountsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /**
   * One page of the listing. A bad parameter is answered with a `400` carrying a usable
   * message — `A cursor requires a limit`, `Invalid user status` — which the client turns
   * into an `ApiError`, so callers should show it rather than a fallback of their own.
   */
  async list(query: UserQuery = {}): Promise<UserPage> {
    const response = await this.client.get<UserListResponse>('/users', {
      limit: query.limit,
      cursor: query.cursor,
      q: query.q?.trim(),
      status: query.status,
      role: query.role,
      sort: query.sort,
    })
    return {
      users: expectArray<User>(response, 'users', 'GET /users').map(withRequiredAdminRole),
      nextCursor: response.nextCursor ?? null,
    }
  }

  /** Every account in one read, in the backend's default administrators-first order. */
  async getAll(): Promise<User[]> {
    return (await this.list()).users
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
}

import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { User, UserPage, UserQuery, UserUpdate } from './userTypes'
import { withRequiredAdminRole } from '@/utils/adminAccess'

interface UserListResponse extends BasicResponse {
  users: User[]
  nextCursor?: string | null
}

/** The accounts themselves: reading, editing, blocking and deleting them. */
export class UserAccountsService extends HttpService {
  /**
   * One page of the listing.
   *
   * @param query the filter, sort and cursor to ask for; an omitted field is not sent
   * @returns the page of accounts and the cursor for the next one, if there is one
   * @throws {BadRequestError} for a rejected parameter. It carries a usable message —
   *         `A cursor requires a limit`, `Invalid user status` — so callers should show it
   *         rather than a fallback of their own.
   * @throws {ContractError} when the response holds no `users` list
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
  async getAll(): Promise<readonly User[]> {
    return (await this.list()).users
  }

  /**
   * @param id the account id
   * @returns the account, with the admin role applied where the address is on the team list
   * @throws {NotFoundError} when there is no such account
   */
  async getById(id: string): Promise<User> {
    const user = await this.client.get<User>(`/users/${id}`)
    return withRequiredAdminRole(user)
  }

  /**
   * @param id the account to edit
   * @param update only the fields that changed; an empty body is refused
   * @returns the envelope
   */
  update(id: string, update: UserUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}`, update)
  }

  /**
   * Anonymises the account. Not reversible.
   *
   * @param id the account to delete
   * @returns the envelope
   */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/users/${id}`)
  }

  /**
   * @param id the account to block
   * @returns the envelope
   */
  block(id: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}/block`)
  }

  /**
   * @param id the account to unblock
   * @returns the envelope
   */
  unblock(id: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${id}/unblock`)
  }
}

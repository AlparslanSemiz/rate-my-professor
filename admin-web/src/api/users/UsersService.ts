import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { UserAccountsService } from './UserAccountsService'
import { UserWarningsService } from './UserWarningsService'
import type { User, UserPage, UserQuery, UserUpdate, Warning } from './userTypes'

export type { User, UserPage, UserQuery, UserRole, UserSort, UserStatus, UserUpdate, Warning } from './userTypes'

/**
 * Everything the panel does to a student or admin account.
 *
 * Two services underneath, because accounts and warnings are two resources with two
 * lifetimes: an account outlives every warning on it, and a warning is addressable on its
 * own. They are composed here rather than exported separately because the profile modal works
 * one account and needs both halves at once.
 */
export class UsersService {
  private readonly accounts: UserAccountsService
  private readonly warnings: UserWarningsService

  constructor(client: HttpTransport) {
    this.accounts = new UserAccountsService(client)
    this.warnings = new UserWarningsService(client)
  }

  /**
   * One page of the listing.
   *
   * @param query filter, sort and cursor; an omitted field is not sent
   * @returns the page and the cursor for the next one, `null` on the last
   * @throws {BadRequestError} carrying a message worth showing — `A cursor requires a limit`,
   *         `Invalid user status`
   */
  async list(query: UserQuery = {}): Promise<UserPage> {
    return this.accounts.list(query)
  }

  /**
   * Every account in one read, administrators first.
   *
   * Unpaged, so it is for counting and for filling a small panel — not for a table. Passing
   * no parameters is what gets the administrators-first order; any parameter at all switches
   * the backend to newest-first.
   *
   * @returns every account, as a list the caller must not mutate
   */
  async getAll(): Promise<readonly User[]> {
    return this.accounts.getAll()
  }

  /**
   * @param id the account id
   * @returns the account, with the admin role applied as `withRequiredAdminRole` decides
   * @throws {NotFoundError} when there is no such account, or it has been anonymised
   */
  async getById(id: string): Promise<User> {
    return this.accounts.getById(id)
  }

  /**
   * Applies a partial edit. Sending an empty body is refused, so callers diff first — see
   * `buildUserUpdate`, which also drops fields the operator is not allowed to change.
   *
   * @param id the account to edit
   * @param update only the fields that changed
   * @returns the envelope
   * @throws {ForbiddenError} when the operator may not moderate this account
   */
  update(id: string, update: UserUpdate): Promise<BasicResponse> {
    return this.accounts.update(id, update)
  }

  /**
   * Anonymises the account. Not reversible, and not the same as blocking.
   *
   * @param id the account to delete
   * @returns the envelope
   * @throws {ForbiddenError} when the operator may not moderate this account — including
   *         their own, which nobody may delete
   */
  delete(id: string): Promise<BasicResponse> {
    return this.accounts.delete(id)
  }

  /**
   * Blocks the account. Bodyless: the action is the endpoint.
   *
   * @param id the account to block
   * @returns the envelope
   * @throws {ForbiddenError} when the operator may not moderate this account
   */
  block(id: string): Promise<BasicResponse> {
    return this.accounts.block(id)
  }

  /**
   * Lifts a block. Bodyless, like `block`.
   *
   * @param id the account to unblock
   * @returns the envelope
   */
  unblock(id: string): Promise<BasicResponse> {
    return this.accounts.unblock(id)
  }

  /**
   * Issues a warning, which notifies the student.
   *
   * @param id the account to warn
   * @param message what the student is told; the only thing the caller supplies, since the
   *        issuer comes from the token and the target from the path
   * @returns the envelope
   */
  warn(id: string, message: string): Promise<BasicResponse> {
    return this.warnings.warn(id, message)
  }

  /**
   * @param id the account whose history to read
   * @returns every warning on the account, newest first as the backend orders them
   * @throws {ContractError} when the response holds no `warnings` list
   */
  async getWarnings(id: string): Promise<Warning[]> {
    return this.warnings.getWarnings(id)
  }

  /**
   * Corrects the wording of a warning already issued. The student is **not** notified again.
   *
   * @param id the account the warning is on
   * @param warningId the warning; `null` ids cannot be addressed and the controls are hidden
   * @param message the corrected text
   * @returns the envelope
   */
  updateWarning(id: string, warningId: string, message: string): Promise<BasicResponse> {
    return this.warnings.updateWarning(id, warningId, message)
  }

  /**
   * Withdraws a warning, removing it from the student's record.
   *
   * @param id the account the warning is on
   * @param warningId the warning to withdraw
   * @returns the envelope
   */
  deleteWarning(id: string, warningId: string): Promise<BasicResponse> {
    return this.warnings.deleteWarning(id, warningId)
  }
}

/** The panel's users service, bound to the shared client. */
export const usersService = new UsersService(apiClient)

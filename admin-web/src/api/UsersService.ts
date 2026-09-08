import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { UserAccountsService } from './UserAccountsService'
import { UserWarningsService } from './UserWarningsService'
import type { User, UserPage, UserQuery, UserUpdate, Warning } from './userTypes'

export type { User, UserPage, UserQuery, UserRole, UserSort, UserStatus, UserUpdate, Warning } from './userTypes'

export class UsersService {
  private readonly accounts: UserAccountsService
  private readonly warnings: UserWarningsService

  constructor(client: ApiClient) {
    this.accounts = new UserAccountsService(client)
    this.warnings = new UserWarningsService(client)
  }

  async list(query: UserQuery = {}): Promise<UserPage> {
    return this.accounts.list(query)
  }

  async getAll(): Promise<User[]> {
    return this.accounts.getAll()
  }

  async getById(id: string): Promise<User> {
    return this.accounts.getById(id)
  }

  update(id: string, update: UserUpdate): Promise<BasicResponse> {
    return this.accounts.update(id, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.accounts.delete(id)
  }

  block(id: string): Promise<BasicResponse> {
    return this.accounts.block(id)
  }

  unblock(id: string): Promise<BasicResponse> {
    return this.accounts.unblock(id)
  }

  warn(id: string, message: string): Promise<BasicResponse> {
    return this.warnings.warn(id, message)
  }

  async getWarnings(id: string): Promise<Warning[]> {
    return this.warnings.getWarnings(id)
  }

  updateWarning(id: string, warningId: string, message: string): Promise<BasicResponse> {
    return this.warnings.updateWarning(id, warningId, message)
  }

  deleteWarning(id: string, warningId: string): Promise<BasicResponse> {
    return this.warnings.deleteWarning(id, warningId)
  }
}

export const usersService = new UsersService(apiClient)

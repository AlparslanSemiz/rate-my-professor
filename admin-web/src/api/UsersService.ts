import { apiClient, type ApiClient } from './ApiClient'
import { RemoteBackedService, delay } from './RemoteBackedService'
import { UsersRepository, type User, type Warning } from './UsersRepository'

export type { User, UserRole, UserStatus, Warning } from './UsersRepository'

export class UsersService extends RemoteBackedService {
  private readonly repository = new UsersRepository()

  constructor(client: ApiClient) {
    super(client)
  }

  getAll(): Promise<User[]> {
    return this.execute(
      () => this.client.get<User[]>('/users'),
      async () => {
        await delay(400)
        return this.repository.getAll()
      }
    )
  }

  getById(id: number): Promise<User | undefined> {
    return this.execute(
      () => this.client.get<User>(`/users/${id}`),
      async () => {
        await delay(200)
        return this.repository.getById(id)
      }
    )
  }

  delete(id: number): Promise<void> {
    return this.execute(
      () => this.client.delete(`/users/${id}`),
      async () => {
        await delay(300)
        this.repository.delete(id)
      }
    )
  }

  block(id: number): Promise<void> {
    return this.execute(
      () => this.client.patch(`/users/${id}/block`),
      async () => {
        await delay(300)
        this.repository.setStatus(id, 'Blocked')
      }
    )
  }

  unblock(id: number): Promise<void> {
    return this.execute(
      () => this.client.patch(`/users/${id}/unblock`),
      async () => {
        await delay(300)
        this.repository.setStatus(id, 'Active')
      }
    )
  }

  warn(id: number, message: string): Promise<Warning> {
    return this.execute(
      () => this.client.post<Warning>(`/users/${id}/warnings`, { message }),
      async () => {
        await delay(300)
        return this.repository.addWarning(id, message)
      }
    )
  }

  getWarnings(id: number): Promise<Warning[]> {
    return this.execute(
      () => this.client.get<Warning[]>(`/users/${id}/warnings`),
      async () => {
        await delay(200)
        return this.repository.getWarnings(id)
      }
    )
  }
}

export const usersService = new UsersService(apiClient)

import { apiClient, delay, type ApiClient } from './ApiClient'

export type UserRole = 'Admin' | 'Student' | 'Professor'
export type UserStatus = 'Active' | 'Inactive' | 'Blocked'

export interface Warning {
  id: number
  message: string
  issuedAt: string
  issuedBy: string
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joinedAt: string
  lastSeenAt: string
  warningCount: number
  bio: string
  reportCount: number
}

const INITIAL_WARNINGS: Record<number, Warning[]> = {
  3: [
    { id: 1, message: 'Inappropriate language in comments.', issuedAt: '2026-05-10T14:22:00Z', issuedBy: 'Admin User' },
  ],
  5: [
    { id: 2, message: 'Spamming group invites.', issuedAt: '2026-04-18T09:11:00Z', issuedBy: 'Admin User' },
    { id: 3, message: 'Repeated rule violations after first warning.', issuedAt: '2026-05-02T16:45:00Z', issuedBy: 'Admin User' },
  ],
}

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'Active',
    joinedAt: '2025-01-10',
    lastSeenAt: '2026-06-11T18:30:00Z',
    warningCount: 0,
    bio: 'Platform administrator. Manages users and content moderation.',
    reportCount: 0,
  },
  {
    id: 2,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Professor',
    status: 'Active',
    joinedAt: '2025-02-14',
    lastSeenAt: '2026-06-10T22:15:00Z',
    warningCount: 0,
    bio: 'Professor of Computer Science. Organizes weekly study sessions.',
    reportCount: 0,
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Student',
    status: 'Active',
    joinedAt: '2025-03-01',
    lastSeenAt: '2026-06-09T11:05:00Z',
    warningCount: 1,
    bio: 'BSc student, 3rd year. Focuses on algorithms and data structures.',
    reportCount: 2,
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Student',
    status: 'Blocked',
    joinedAt: '2025-03-15',
    lastSeenAt: '2026-05-01T08:00:00Z',
    warningCount: 3,
    bio: '',
    reportCount: 5,
  },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    role: 'Student',
    status: 'Active',
    joinedAt: '2025-04-02',
    lastSeenAt: '2026-06-11T07:50:00Z',
    warningCount: 2,
    bio: 'Master student in Data Science.',
    reportCount: 1,
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'Professor',
    status: 'Active',
    joinedAt: '2025-04-18',
    lastSeenAt: '2026-06-08T16:20:00Z',
    warningCount: 0,
    bio: 'Associate Professor of Mathematics. Runs the calculus study group.',
    reportCount: 0,
  },
  {
    id: 7,
    name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'Student',
    status: 'Inactive',
    joinedAt: '2025-05-20',
    lastSeenAt: '2026-03-12T10:00:00Z',
    warningCount: 0,
    bio: '',
    reportCount: 0,
  },
]

export class UsersService {
  private users: User[] = [...INITIAL_USERS]
  private warnings: Record<number, Warning[]> = { ...INITIAL_WARNINGS }
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<User[]> {
    if (this.client.isConfigured) return this.client.get<User[]>('/users')

    await delay(400)
    return [...this.users]
  }

  async getById(id: number): Promise<User | undefined> {
    if (this.client.isConfigured) return this.client.get<User>(`/users/${id}`)

    await delay(200)
    return this.users.find((u) => u.id === id)
  }

  async delete(id: number): Promise<void> {
    if (this.client.isConfigured) return this.client.delete(`/users/${id}`)

    await delay(300)
    this.users = this.users.filter((u) => u.id !== id)
  }

  async block(id: number): Promise<void> {
    if (this.client.isConfigured) return this.client.patch(`/users/${id}/block`)

    await delay(300)
    this.users = this.users.map((u) => (u.id === id ? { ...u, status: 'Blocked' } : u))
  }

  async unblock(id: number): Promise<void> {
    if (this.client.isConfigured) return this.client.patch(`/users/${id}/unblock`)

    await delay(300)
    this.users = this.users.map((u) => (u.id === id ? { ...u, status: 'Active' } : u))
  }

  async warn(id: number, message: string): Promise<Warning> {
    if (this.client.isConfigured) return this.client.post<Warning>(`/users/${id}/warnings`, { message })

    await delay(300)
    const warning: Warning = {
      id: Date.now(),
      message,
      issuedAt: new Date().toISOString(),
      issuedBy: 'Admin User',
    }
    this.warnings[id] = [warning, ...(this.warnings[id] ?? [])]
    this.users = this.users.map((u) =>
      u.id === id ? { ...u, warningCount: u.warningCount + 1 } : u
    )
    return warning
  }

  async getWarnings(id: number): Promise<Warning[]> {
    if (this.client.isConfigured) return this.client.get<Warning[]>(`/users/${id}/warnings`)

    await delay(200)
    return this.warnings[id] ?? []
  }
}

export const usersService = new UsersService(apiClient)

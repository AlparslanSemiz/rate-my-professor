export interface User {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Developer' | 'Student'
  status: 'Active' | 'Inactive'
  joinedAt: string
}

let MOCK_USERS: User[] = [
  { id: 1, name: 'Alice Smith',   email: 'alice@example.com',   role: 'Admin',     status: 'Active',   joinedAt: '2025-01-10' },
  { id: 2, name: 'Bob Johnson',   email: 'bob@example.com',     role: 'Developer', status: 'Active',   joinedAt: '2025-02-14' },
  { id: 3, name: 'Carol White',   email: 'carol@example.com',   role: 'Student',   status: 'Active',   joinedAt: '2025-03-01' },
  { id: 4, name: 'David Brown',   email: 'david@example.com',   role: 'Student',   status: 'Inactive', joinedAt: '2025-03-15' },
  { id: 5, name: 'Emma Davis',    email: 'emma@example.com',    role: 'Student',   status: 'Active',   joinedAt: '2025-04-02' },
  { id: 6, name: 'Frank Miller',  email: 'frank@example.com',   role: 'Developer', status: 'Active',   joinedAt: '2025-04-18' },
]

export async function getUsers(): Promise<User[]> {
  await new Promise((r) => setTimeout(r, 400))
  return [...MOCK_USERS]
}

export async function deleteUser(id: number): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))

  const nextUsers = MOCK_USERS.filter((user) => user.id !== id)
  if (nextUsers.length === MOCK_USERS.length) throw new Error(`User with id ${id} not found`)

  MOCK_USERS = nextUsers
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { UsersService } from './UsersService'

const API_BASE_URL = 'https://api.test'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createUsersService() {
  return new UsersService(new ApiClient(API_BASE_URL))
}

describe('UsersService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads users from the backend users envelope', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      users: [
        {
          id: 'user-1',
          username: 'Alice Smith',
          kitEmail: 'alice@student.kit.edu',
          role: 'ADMIN',
          status: 'ACTIVE',
          joined: '2025-01-10',
          lastOnline: '2026-06-11T18:30:00Z',
          biography: 'Platform administrator.',
          warnings: 0,
          reports: 0,
        },
      ],
    }))
    const service = createUsersService()

    await expect(service.getAll()).resolves.toMatchObject([
      {
        id: 'user-1',
        username: 'Alice Smith',
        kitEmail: 'alice@student.kit.edu',
      },
    ])
  })

  it('treats required admin emails as admin accounts', async () => {
    const requiredAdminEmails = [
      'u-kisi4@student.kit.edu',
      'u-kisi5@student.kit.edu',
      'u-kisi6@student.kit.edu',
      'u-kisi7@student.kit.edu',
      'u-kisi8@student.kit.edu',
    ]

    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      users: requiredAdminEmails.map((kitEmail, index) => ({
        id: `user-${index + 1}`,
        username: `Required Admin ${index + 1}`,
        kitEmail,
        role: 'STUDENT',
        status: 'ACTIVE',
        joined: '2025-01-10',
        lastOnline: '2026-06-11T18:30:00Z',
        biography: 'Required administrator.',
        warnings: 0,
        reports: 0,
      })),
    }))
    const service = createUsersService()

    const users = await service.getAll()

    expect(users).toHaveLength(requiredAdminEmails.length)
    expect(users.every((user) => user.role === 'ADMIN')).toBe(true)
  })

  it('maps backend warning history to display warnings', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      warnings: [
        {
          userID: 'user-1',
          message: 'Inappropriate language.',
          createdAt: '2026-05-10T14:22:00Z',
          createdFrom: { id: 'admin-1', createdAt: '2026-05-10T14:20:00Z' },
        },
      ],
    }))
    const service = createUsersService()

    await expect(service.getWarnings('user-1')).resolves.toEqual([
      {
        userID: 'user-1',
        message: 'Inappropriate language.',
        createdAt: '2026-05-10T14:22:00Z',
        issuedBy: 'admin-1',
      },
    ])
  })

  it('sends warnings with the issuing admin id expected by the backend', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Warning created' }))
    const service = createUsersService()

    await service.warn('user-1', 'Bad behavior', 'admin-1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsedUrl = new URL(url)
    expect(parsedUrl.pathname).toBe('/users/user-1/warnings')
    expect(parsedUrl.searchParams.get('userID')).toBe('user-1')
    expect(parsedUrl.searchParams.get('message')).toBe('Bad behavior')
    expect(parsedUrl.searchParams.get('createdFrom.id')).toBe('admin-1')
    expect(parsedUrl.searchParams.get('id')).toBeTruthy()
    expect(init.method).toBe('POST')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { UsersService } from './UsersService'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createUsersService() {
  return new UsersService(new ApiClient(TEST_API_BASE_URL))
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
      'unzhz@student.kit.edu',
      'ugoqu@student.kit.edu',
      'ugjlu@student.kit.edu',
      'uzvqy@student.kit.edu',
      'uiolj@student.kit.edu',
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

  it('normalizes a required admin role when loading a single user', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'user-1',
      username: 'Required Admin',
      kitEmail: 'unzhz@student.kit.edu',
      role: 'STUDENT',
      status: 'ACTIVE',
      joined: '2025-01-10',
      lastOnline: '2026-06-11T18:30:00Z',
      biography: 'Required administrator.',
      warnings: 0,
      reports: 0,
    }))
    const service = createUsersService()

    await expect(service.getById('user-1')).resolves.toMatchObject({
      id: 'user-1',
      role: 'ADMIN',
    })
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
          createdFrom: { id: 'admin-1', name: 'Alparslan', createdAt: '2026-05-10T14:20:00Z' },
        },
      ],
    }))
    const service = createUsersService()

    await expect(service.getWarnings('user-1')).resolves.toEqual([
      {
        id: null,
        userID: 'user-1',
        message: 'Inappropriate language.',
        createdAt: '2026-05-10T14:22:00Z',
        // The issuer's student id, which is also what /auth/me reports for the signed-in
        // admin, and their display name for the history line.
        issuedBy: 'admin-1',
        issuedByName: 'Alparslan',
      },
    ])
  })

  it('names an issuer the backend did not name', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      warnings: [
        {
          id: 'warning-1',
          userID: 'user-1',
          message: 'Inappropriate language.',
          createdAt: '2026-05-10T14:22:00Z',
          createdFrom: null,
        },
      ],
    }))
    const service = createUsersService()

    await expect(service.getWarnings('user-1')).resolves.toMatchObject([
      { issuedBy: '', issuedByName: 'Unknown' },
    ])
  })

  it('carries the warning id through once the backend reports one', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      warnings: [
        {
          id: 'warning-1',
          userID: 'user-1',
          message: 'Inappropriate language.',
          createdAt: '2026-05-10T14:22:00Z',
          createdFrom: { id: 'admin-1', createdAt: '2026-05-10T14:20:00Z' },
        },
      ],
    }))
    const service = createUsersService()

    await expect(service.getWarnings('user-1')).resolves.toMatchObject([{ id: 'warning-1' }])
  })

  it('sends only the supplied fields when editing a user', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated user successfully' }))
    const service = createUsersService()

    await service.update('user-1', { username: 'Renamed', role: 'ADMIN' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/users/user-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ username: 'Renamed', role: 'ADMIN' })
  })

  it('corrects and withdraws a warning by its own id', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated warning successfully' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted warning successfully' }))
    const service = createUsersService()

    await service.updateWarning('user-1', 'warning-1', 'Corrected reason')
    await service.deleteWarning('user-1', 'warning-1')

    const [patchUrl, patchInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(patchUrl).toBe(`${TEST_API_BASE_URL}/users/user-1/warnings/warning-1`)
    expect(patchInit.method).toBe('PATCH')
    expect(JSON.parse(patchInit.body as string)).toEqual({ message: 'Corrected reason' })

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${TEST_API_BASE_URL}/users/user-1/warnings/warning-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('blocks and unblocks users with bodyless PATCH requests', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Blocked' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Unblocked' }))
    const service = createUsersService()

    await service.block('user-1')
    await service.unblock('user-1')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${TEST_API_BASE_URL}/users/user-1/block`,
      expect.objectContaining({ method: 'PATCH', body: undefined })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${TEST_API_BASE_URL}/users/user-1/unblock`,
      expect.objectContaining({ method: 'PATCH', body: undefined })
    )
  })

  it('sends nothing but the message when issuing a warning', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Warning created' }))
    const service = createUsersService()

    await service.warn('user-1', 'Bad behavior')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/users/user-1/warnings`)
    expect(init.method).toBe('POST')
    // The target is in the path and the issuer comes from the token, so neither belongs in
    // the body — sending an issuer is what let the panel name the wrong one.
    expect(JSON.parse(init.body as string)).toEqual({ message: 'Bad behavior' })
  })
  it('soft-deletes a user account by id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted user successfully' }))
    const service = createUsersService()

    await expect(service.delete('user-1')).resolves.toEqual({
      success: true,
      message: 'Deleted user successfully',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/users/user-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

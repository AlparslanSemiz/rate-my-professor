import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '../auth-session.mjs'
import { sendJson } from '../http.mjs'
import {
  changeUserStatus,
  deleteUser,
  USER_STATUS_CHANGES,
} from './users-lifecycle.mjs'
import { getUser, getWarnings, listUsers } from './users-read.mjs'
import { createWarning } from './users-warnings.mjs'
import { handleUsers } from './users.mjs'

vi.mock('../auth-session.mjs', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('../http.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, sendJson: vi.fn() }
})

vi.mock('./users-lifecycle.mjs', () => ({
  changeUserStatus: vi.fn(),
  deleteUser: vi.fn(),
  USER_STATUS_CHANGES: {
    block: {
      status: 'BLOCKED',
      action: 'USER_BLOCKED',
      message: 'Student blocked successfully',
    },
    unblock: {
      status: 'ACTIVE',
      action: 'USER_UNBLOCKED',
      message: 'Student unblocked successfully',
    },
  },
}))

vi.mock('./users-warnings.mjs', () => ({
  createWarning: vi.fn(),
}))

vi.mock('./users-read.mjs', () => ({
  getUser: vi.fn(),
  getWarnings: vi.fn(),
  listUsers: vi.fn(),
}))

const USER_ID = '11111111-1111-1111-1111-111111111111'
const admin = { id: 'admin-1', role: 'ADMIN' }
const req = (method) => ({ method })
const res = {}

describe('mock user route dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(admin)
  })

  it('stops when the request is not authorized', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(null)

    await handleUsers(req('GET'), res, ['users'])

    expect(listUsers).not.toHaveBeenCalled()
    expect(sendJson).not.toHaveBeenCalled()
  })

  it('routes user list, detail, and warning history reads', async () => {
    await handleUsers(req('GET'), res, ['users'])
    await handleUsers(req('GET'), res, ['users', USER_ID])
    await handleUsers(req('GET'), res, ['users', USER_ID, 'warnings'])

    expect(listUsers).toHaveBeenCalledWith(res)
    expect(getUser).toHaveBeenCalledWith(res, USER_ID)
    expect(getWarnings).toHaveBeenCalledWith(res, USER_ID)
  })

  it('routes status changes, warning creation, and deletion', async () => {
    await handleUsers(req('PATCH'), res, ['users', USER_ID, 'block'])
    await handleUsers(req('POST'), res, ['users', USER_ID, 'warnings'])
    await handleUsers(req('DELETE'), res, ['users', USER_ID])

    expect(changeUserStatus).toHaveBeenCalledWith(
      res,
      USER_ID,
      admin,
      USER_STATUS_CHANGES.block,
    )
    expect(createWarning).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }), res, USER_ID, admin)
    expect(deleteUser).toHaveBeenCalledWith(res, USER_ID, admin)
  })

  it('returns not found before dispatching an invalid user id', async () => {
    await handleUsers(req('GET'), res, ['users', 'not-a-uuid'])

    expect(sendJson).toHaveBeenCalledWith(res, 404, {
      message: 'User not found',
      success: false,
    })
    expect(getUser).not.toHaveBeenCalled()
  })
})

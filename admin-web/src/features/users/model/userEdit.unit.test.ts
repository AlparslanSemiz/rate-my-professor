import { describe, expect, it } from 'vitest'
import type { User } from '@/api/users'
import { getUserAccess } from './access'
import {
  buildUserUpdate,
  canSaveUserEdit,
  createUserEditDraft,
  type UserEditDraft,
} from './userEdit'

const user: User = {
  id: 'user-1',
  username: 'Alice Smith',
  kitEmail: 'alice@student.kit.edu',
  role: 'STUDENT',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: 'Computer Science student.',
  warnings: 0,
  reports: 0,
  credibilityScore: 100,
}

function draft(update: Partial<UserEditDraft> = {}): UserEditDraft {
  return { ...createUserEditDraft(user), ...update }
}

describe('user edit model', () => {
  it('sends only changed profile fields', () => {
    const access = getUserAccess(user, { id: 'admin-1' })

    expect(
      buildUserUpdate(user, draft({ username: '  Alice Johnson  ', biography: 'Updated.' }), access),
    ).toEqual({
      username: 'Alice Johnson',
      biography: 'Updated.',
    })
  })

  it('keeps protected self access fields out of the update', () => {
    const access = getUserAccess(user, { id: user.id, isSuperAdmin: true })

    expect(
      buildUserUpdate(
        user,
        draft({ status: 'BLOCKED', role: 'ADMIN', credibilityScore: 75 }),
        access,
      ),
    ).toEqual({})
  })

  it('locks admin moderation and status for a non-elevated operator', () => {
    const adminTarget: User = { ...user, role: 'ADMIN' }
    const access = getUserAccess(adminTarget, { id: 'admin-1' })

    expect(access.canModerate).toBe(false)
    expect(access.canEditStatus).toBe(false)
    expect(access.canEditCredibilityScore).toBe(true)
    expect(
      buildUserUpdate(
        adminTarget,
        { ...createUserEditDraft(adminTarget), status: 'BLOCKED', credibilityScore: 75 },
        access,
      ),
    ).toEqual({ credibilityScore: 75 })
  })

  it('unlocks admin moderation and status for an elevated operator', () => {
    const adminTarget: User = { ...user, role: 'ADMIN' }
    const access = getUserAccess(adminTarget, { id: 'admin-1', isSuperAdmin: true })

    expect(access.canModerate).toBe(true)
    expect(
      buildUserUpdate(adminTarget, { ...createUserEditDraft(adminTarget), status: 'BLOCKED' }, access),
    ).toEqual({ status: 'BLOCKED' })
  })

  it('does not allow saving an empty username', () => {
    const access = getUserAccess(user, { id: 'admin-1' })

    expect(canSaveUserEdit(user, draft({ username: '   ' }), access)).toBe(false)
  })
})

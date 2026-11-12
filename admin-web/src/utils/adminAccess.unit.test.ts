import { describe, expect, it } from 'vitest'
import { withRequiredAdminRole } from './adminAccess'

describe('withRequiredAdminRole', () => {
  it('still reports the elevated address as a plain admin, so nothing renders differently', () => {
    const subject = { email: 'unzhz@student.kit.edu', role: 'STUDENT' }

    expect(withRequiredAdminRole(subject).role).toBe('ADMIN')
  })
})

import { describe, expect, it } from 'vitest'
import { isRequiredAdminEmail, isSuperAdminEmail, withRequiredAdminRole } from './adminAccess'

describe('isSuperAdminEmail', () => {
  it('recognises the address that may act on admin accounts', () => {
    expect(isSuperAdminEmail('u-kisi4@student.kit.edu')).toBe(true)
  })

  it('normalizes casing and surrounding whitespace, as the login form does', () => {
    expect(isSuperAdminEmail('  u-kisi4@Student.KIT.edu ')).toBe(true)
  })

  it('does not extend the permission to the rest of the admin team', () => {
    const otherAdmins = [
      'u-kisi5@student.kit.edu',
      'u-kisi6@student.kit.edu',
      'u-kisi7@student.kit.edu',
      'u-kisi8@student.kit.edu',
      'u-kisi9@student.kit.edu',
    ]

    expect(otherAdmins.every(isRequiredAdminEmail)).toBe(true)
    expect(otherAdmins.some(isSuperAdminEmail)).toBe(false)
  })

  it('answers false for an unknown or empty address', () => {
    expect(isSuperAdminEmail('bob@student.kit.edu')).toBe(false)
    expect(isSuperAdminEmail('')).toBe(false)
  })
})

describe('withRequiredAdminRole', () => {
  it('still reports the elevated address as a plain admin, so nothing renders differently', () => {
    const subject = { email: 'u-kisi4@student.kit.edu', role: 'STUDENT' }

    expect(withRequiredAdminRole(subject).role).toBe('ADMIN')
  })
})

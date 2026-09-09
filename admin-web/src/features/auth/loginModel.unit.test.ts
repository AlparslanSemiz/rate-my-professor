import { describe, expect, it } from 'vitest'
import { routes } from '@/constants/routes'
import { attemptedPath, isCompleteLoginCode } from './loginModel'

describe('login model', () => {
  it('recognizes complete one-time login codes after trimming', () => {
    expect(isCompleteLoginCode('123456')).toBe(true)
    expect(isCompleteLoginCode(' 123456 ')).toBe(true)
    expect(isCompleteLoginCode('12345')).toBe(false)
  })

  it('extracts only safe redirected admin paths', () => {
    expect(attemptedPath({ from: routes.users })).toBe(routes.users)
    expect(attemptedPath({ from: routes.login })).toBeNull()
    expect(attemptedPath({ from: 'https://example.com/phish' })).toBeNull()
    expect(attemptedPath({ from: 42 })).toBeNull()
    expect(attemptedPath(null)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './getErrorMessage'
import { AssertionError } from './assert'

describe('getErrorMessage', () => {
  it('returns a useful Error message', () => {
    expect(getErrorMessage(new Error('Backend unavailable'), 'Fallback')).toBe('Backend unavailable')
  })

  it('uses the fallback for empty Error messages', () => {
    expect(getErrorMessage(new Error('  '), 'Fallback')).toBe('Fallback')
  })

  it('uses the fallback for non-Error values', () => {
    expect(getErrorMessage({ message: 'Untrusted shape' }, 'Fallback')).toBe('Fallback')
  })

  it('uses the fallback for internal runtime errors rather than leaking them', () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'map')")
    expect(getErrorMessage(bug, 'Failed to load users')).toBe('Failed to load users')
  })

  it('hides an assertion failure, which names a bug in this codebase', () => {
    // The operator can do nothing about a broken invariant, and its message describes our
    // own code rather than anything they did.
    expect(getErrorMessage(new AssertionError('ctx is missing'), 'Fallback')).toBe('Fallback')
  })

})

import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './getErrorMessage'

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
})

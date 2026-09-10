import { describe, expect, it } from 'vitest'
import { withAlpha } from './color'

describe('withAlpha', () => {
  it('turns a six-digit accent into an rgba value', () => {
    expect(withAlpha('#3b82f6', 0.18)).toBe('rgba(59, 130, 246, 0.18)')
  })

  it('accepts the shorthand form', () => {
    expect(withAlpha('#fff', 1)).toBe('rgba(255, 255, 255, 1)')
  })

  it('does not require the leading hash', () => {
    expect(withAlpha('22c55e', 0.5)).toBe('rgba(34, 197, 94, 0.5)')
  })
})

import { describe, expect, it } from 'vitest'
import { assert, AssertionError, assertNever } from './assert'

describe('assert', () => {
  it('passes a truthy invariant through', () => {
    expect(() => assert('value', 'should not throw')).not.toThrow()
  })

  it('throws an AssertionError naming what is wrong', () => {
    expect(() => assert(null, 'context is missing')).toThrowError(AssertionError)
    expect(() => assert(null, 'context is missing')).toThrowError('context is missing')
  })

  it.each([0, '', false, undefined, null, Number.NaN])('rejects the falsy value %p', (value) => {
    expect(() => assert(value, 'nope')).toThrowError(AssertionError)
  })
})

describe('assertNever', () => {
  it('reports the value the exhaustive dispatch did not expect', () => {
    // Cast because the whole point is that the compiler believes this cannot happen.
    expect(() => assertNever('SURPRISE' as never, 'catalogue deletion')).toThrowError(
      /catalogue deletion: unhandled value "SURPRISE"/,
    )
  })
})

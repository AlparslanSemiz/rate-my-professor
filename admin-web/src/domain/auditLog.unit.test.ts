import { describe, expect, it } from 'vitest'
import { endOfDay, startOfDay, isLogActorType } from './auditLog'

describe('log date bounds', () => {
  it('covers the local day that was picked rather than the UTC one', () => {
    const from = startOfDay('2026-07-01')
    const to = endOfDay('2026-07-01')
    expect(from).toBeDefined()
    expect(to).toBeDefined()

    const start = new Date(from as string)
    const end = new Date(to as string)

    // Whatever the timezone, the bounds must land on the local day that was picked.
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(6)
    expect(start.getDate()).toBe(1)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)

    expect(end.getDate()).toBe(1)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })

  it('spans the whole day, one millisecond short of the next', () => {
    const start = new Date(startOfDay('2026-07-01') as string).getTime()
    const end = new Date(endOfDay('2026-07-01') as string).getTime()
    expect(end - start).toBe(24 * 60 * 60 * 1000 - 1)
  })

  it('sends nothing when no date was picked', () => {
    expect(startOfDay(undefined)).toBeUndefined()
    expect(endOfDay('')).toBeUndefined()
  })

  it('sends nothing for an unparseable date', () => {
    expect(startOfDay('not-a-date')).toBeUndefined()
  })
})

describe('isLogActorType', () => {
  it('accepts the two actor types and rejects anything else', () => {
    expect(isLogActorType('ADMIN')).toBe(true)
    expect(isLogActorType('USER')).toBe(true)
    expect(isLogActorType('ROBOT')).toBe(false)
    expect(isLogActorType(null)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'
import { EMPTY_VALUE } from './emptyValue'

// The rendered values are the operator's local time, so these assert the shape rather than a
// fixed string: the suite has to pass in every timezone.
const DATE_ONLY = /^\d{2} \w{3} \d{4}$/
const WITH_MINUTES = /^\d{2} \w{3} \d{4}, \d{2}:\d{2}$/
const WITH_SECONDS = /^\d{2} \w{3} \d{4}, \d{2}:\d{2}:\d{2}$/

const ISO = '2026-06-11T18:30:45Z'

describe('formatDate', () => {
  it('renders the day alone by default', () => {
    expect(formatDate(ISO)).toMatch(DATE_ONLY)
  })

  it('adds the time when asked', () => {
    expect(formatDate(ISO, { withTime: true })).toMatch(WITH_MINUTES)
  })

  it('adds seconds only when both options are given', () => {
    expect(formatDate(ISO, { withTime: true, withSeconds: true })).toMatch(WITH_SECONDS)
  })

  /** Seconds without a time would be a date with a stray number on the end. */
  it('ignores seconds when the time itself was not asked for', () => {
    expect(formatDate(ISO, { withSeconds: true })).toMatch(DATE_ONLY)
  })

  it('reports an unparseable value rather than rendering "Invalid Date"', () => {
    // The shared marker, not a literal: an unparseable date is the same "no value" the
    // rest of the panel draws, and the two used to be different glyphs.
    expect(formatDate('not a date', { withTime: true })).toBe(EMPTY_VALUE)
  })
})

import { describe, expect, it } from 'vitest'
import { formatAverageRating } from './catalogModel'

describe('formatAverageRating', () => {
  it('renders a real average to one decimal', () => {
    expect(formatAverageRating(4.25, 30)).toBe('4.3')
  })

  it('renders a dash when nobody has rated, even though the backend sends 0', () => {
    expect(formatAverageRating(0, 0)).toBe('—')
  })

  it('keeps a genuine zero average when there are ratings behind it', () => {
    expect(formatAverageRating(0, 4)).toBe('0.0')
  })

  it('still handles a null average defensively', () => {
    expect(formatAverageRating(null, 12)).toBe('—')
  })
})


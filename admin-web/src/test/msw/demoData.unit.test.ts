import { describe, expect, it } from 'vitest'
import { demoBackend } from './demoData'

/**
 * The demo fixture stands in for the backend, so its enum values have to be shaped like the
 * backend's or the panel renders something no real deployment would show.
 *
 * `F-073`: the rating score categories were written lowercase - `content`, `clarity`,
 * `difficulty` - while every other enum in the same file is SCREAMING_SNAKE. `enumLabel`
 * preserves the first character's case (`CONTENT` -> "Content", `content` -> "content"), so
 * the Scores column read "content 4 · clarity 5" against title-cased labels everywhere else.
 * `RatingsService.unit.test.ts` shows the wire shape is `{ CONTENT: 5 }`.
 */
describe('the demo fixture', () => {
  it('writes rating categories the way the backend does', () => {
    // `demoBackend` returns a `Partial<MswDb>`, so the ratings are asserted present rather
    // than assumed: `F-041` is the round where a fixture that served nothing read exactly like
    // a clean measurement.
    const ratings = demoBackend().ratings
    expect(ratings).toBeDefined()

    // `scores` is nullable on the wire, which is why `ratingMapper` defaults it to `{}`. The
    // same default here keeps the test about casing rather than about absence.
    const categories = (ratings ?? []).flatMap((rating) => Object.keys(rating.scores ?? {}))
    expect(categories.length).toBeGreaterThan(0)
    expect(categories.filter((key) => !/^[A-Z][A-Z_]*$/.test(key))).toEqual([])
  })
})

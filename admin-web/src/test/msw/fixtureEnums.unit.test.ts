import { describe, expect, it } from 'vitest'
import { demoBackend } from './demoData'
import { sweepFixture } from './sweepFixture'

/**
 * The MSW fixtures stand in for the backend, so their enum values have to be shaped like the
 * backend's or the panel renders something no real deployment would show.
 *
 * `F-073`: the rating score categories were written lowercase - `content`, `clarity`,
 * `difficulty` - while every other enum in the same files is SCREAMING_SNAKE. `enumLabel`
 * preserves the first character's case (`CONTENT` -> "Content", `content` -> "content"), so
 * the Scores column read "content 4 · clarity 5" against title-cased labels everywhere else.
 * `RatingsService.unit.test.ts` shows the wire shape.
 *
 * **The wire shape changed under this pin on 2026-09-10, and that is the pin working.** The
 * categories arrive as `topics: [{category, value}]`, not as a `scores` map: `F-089`. The
 * question - is a fixture's enum written the way the backend writes it - is unchanged, so both
 * halves below now read `topics`.
 *
 * **Two fixtures, and the first version of this pin only knew about one.** `demoBackend` feeds
 * the browser and the end-to-end layer; `sweepFixture` feeds the call-surface, resilience and
 * accessibility layers. The defect was in both and the fix reached one, which is why the
 * source sweep below exists beside the behavioural check: a pin that names its subject can
 * only ever be as complete as whoever wrote the name.
 */

/** The shape a backend enum value has, and the only shape a fixture may write. */
const SCREAMING_SNAKE = /^[A-Z][A-Z0-9_]*$/

describe('the MSW fixtures', () => {
  it('write rating categories the way the backend does', () => {
    // The builders return a `Partial<MswDb>`, so the ratings are asserted present rather than
    // assumed: `F-041` is the round where a fixture that served nothing read exactly like a
    // clean measurement.
    for (const [name, build] of [
      ['demoBackend', demoBackend],
      ['sweepFixture', sweepFixture],
    ] as const) {
      const ratings = build().ratings
      expect(ratings, `${name} serves no ratings`).toBeDefined()

      // `topics` is nullable on the wire, which is why `ratingMapper` defaults it to `{}`. The
      // same default here keeps the test about casing rather than about absence.
      const categories = (ratings ?? []).flatMap((rating) =>
        (rating.topics ?? []).map((topic) => topic.category ?? ''),
      )
      expect(categories.length, `${name} serves no score categories`).toBeGreaterThan(0)
      expect(categories.filter((key) => !SCREAMING_SNAKE.test(key))).toEqual([])
    }
  })

  it('carry no lowercase category in any fixture module, named or not', () => {
    // Discovered from the modules rather than from a list, so a third fixture added later is
    // swept without anybody remembering to add it here.
    const sources = import.meta.glob<string>(
      ['/src/test/msw/**/*.ts', '!/src/test/msw/**/*.test.ts'],
      { query: '?raw', import: 'default', eager: true },
    )

    const offenders: string[] = []
    let literals = 0
    for (const [path, source] of Object.entries(sources)) {
      for (const match of source.matchAll(/category:\s*'([^']*)'/g)) {
        literals += 1
        const key = match[1].trim()
        if (key && !SCREAMING_SNAKE.test(key)) offenders.push(`${path}: ${key}`)
      }
    }

    // Without this the sweep passes on a glob that matched nothing, which is a green over a
    // surface it never read - the same trap `callSurface.integration.test.ts` guards against.
    expect(literals, 'no `category` literal was found to check').toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildActivityLogQuery,
  decodeLogCursor,
  encodeLogCursor,
  parseActivityLogQuery,
} from './activity-query.mjs'

const ACTOR_ID = '22222222-2222-2222-2222-222222222222'
const LOG_ID = 'acacacac-1111-1111-1111-111111111111'

describe('activity query parsing', () => {
  it('parses supported filters and builds a parameterized query', () => {
    const url = new URL(
      `http://localhost/activity-logs?limit=25&actorId=${ACTOR_ID}&type=COMMENT_CREATED&targetType=COMMENT&outcome=SUCCESS&q=Mira&from=2026-07-01T00:00:00.000Z`,
    )

    const parsed = parseActivityLogQuery(url)
    expect(parsed.error).toBeUndefined()

    const query = buildActivityLogQuery(parsed.value)
    expect(query.text).toContain('actor_id = $1')
    expect(query.text).toContain('type = $2')
    expect(query.text).toContain('target_type = $3')
    expect(query.text).toContain('outcome = $4')
    expect(query.text).toContain('created_at >= $5')
    expect(query.text).toContain('ILIKE $6')
    expect(query.values).toEqual([
      ACTOR_ID,
      'COMMENT_CREATED',
      'COMMENT',
      'SUCCESS',
      new Date('2026-07-01T00:00:00.000Z'),
      '%Mira%',
      26,
    ])
  })

  it('reads an unfiltered first page', () => {
    const parsed = parseActivityLogQuery(new URL('http://localhost/activity-logs'))
    const query = buildActivityLogQuery(parsed.value)

    expect(query.text).not.toContain('WHERE')
    expect(query.values).toEqual([51])
  })

  it('rejects invalid ranges, limits, enums, ids, and cursors', () => {
    const invalidQueries = [
      'limit=0',
      'limit=101',
      'actorId=not-a-uuid',
      'type=UNKNOWN',
      'targetType=UNKNOWN',
      'outcome=MAYBE',
      'from=not-a-date',
      'from=2026-07-02&to=2026-07-01',
      'cursor=invalid',
    ]

    for (const query of invalidQueries) {
      expect(
        parseActivityLogQuery(new URL(`http://localhost/activity-logs?${query}`)).error,
      ).toBeTruthy()
    }
  })

  it('pages after an opaque cursor', () => {
    const cursor = encodeLogCursor({
      id: LOG_ID,
      created_at: new Date('2026-07-23T10:00:00.000Z'),
    })
    expect(decodeLogCursor(cursor)).toEqual({
      id: LOG_ID,
      createdAt: '2026-07-23T10:00:00.000Z',
    })

    const parsed = parseActivityLogQuery(
      new URL(`http://localhost/activity-logs?cursor=${cursor}`),
    )
    const query = buildActivityLogQuery(parsed.value)

    expect(query.text).toContain('(created_at, id) < ($1, $2)')
    expect(query.values).toEqual(['2026-07-23T10:00:00.000Z', LOG_ID, 51])
  })
})

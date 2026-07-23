import { describe, expect, it } from 'vitest'
import {
  buildAuditLogQuery,
  decodeAuditCursor,
  encodeAuditCursor,
  parseAuditLogQuery,
} from './audit-query.mjs'

const ACTOR_ID = '11111111-1111-1111-1111-111111111111'
const LOG_ID = 'abababab-1111-1111-1111-111111111111'

describe('audit query parsing', () => {
  it('parses supported filters and builds a parameterized query', () => {
    const url = new URL(
      `http://localhost/audit-logs?limit=25&actorId=${ACTOR_ID}&action=USER_BLOCKED&targetType=USER&q=Jonas&from=2026-07-01T00:00:00.000Z`,
    )

    const parsed = parseAuditLogQuery(url)
    expect(parsed.error).toBeUndefined()

    const query = buildAuditLogQuery(parsed.value)
    expect(query.text).toContain('actor_id = $1')
    expect(query.text).toContain('action = $2')
    expect(query.text).toContain('target_type = $3')
    expect(query.text).toContain('created_at >= $4')
    expect(query.text).toContain('ILIKE $5')
    expect(query.values).toEqual([
      ACTOR_ID,
      'USER_BLOCKED',
      'USER',
      new Date('2026-07-01T00:00:00.000Z'),
      '%Jonas%',
      26,
    ])
  })

  it('rejects invalid ranges, limits, enums, ids, and cursors', () => {
    const invalidQueries = [
      'limit=0',
      'actorId=not-a-uuid',
      'action=UNKNOWN',
      'targetType=UNKNOWN',
      'from=not-a-date',
      'from=2026-07-02&to=2026-07-01',
      'cursor=invalid',
    ]

    for (const query of invalidQueries) {
      expect(parseAuditLogQuery(new URL(`http://localhost/audit-logs?${query}`)).error).toBeTruthy()
    }
  })

  it('round-trips opaque cursor values', () => {
    const cursor = encodeAuditCursor({
      id: LOG_ID,
      created_at: new Date('2026-07-23T10:00:00.000Z'),
    })

    expect(decodeAuditCursor(cursor)).toEqual({
      id: LOG_ID,
      createdAt: '2026-07-23T10:00:00.000Z',
    })
  })
})

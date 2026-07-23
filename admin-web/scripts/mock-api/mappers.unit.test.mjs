import { describe, expect, it } from 'vitest'
import { toBugReport, toReportedComment } from './mappers.mjs'

describe('mock API response mappers', () => {
  it('maps a reported-comment row to the frontend contract', () => {
    const row = {
      id: 'report-1',
      comment_content: 'Comment',
      post_context: 'Post',
      report_text: 'Reason',
      reported_id: 'user-1',
      reported_name: 'Reported User',
      reported_role: 'STUDENT',
      reported_warnings: '2',
      reported_status: 'BLOCKED',
      reporter_id: 'user-2',
      reporter_name: 'Reporter',
      reporter_role: 'ADMIN',
      reporter_warnings: '0',
      reporter_status: 'ACTIVE',
      reason: 'INSULT',
      status: 'OPEN',
      date: new Date('2026-07-12T09:05:00.000Z'),
    }

    expect(toReportedComment(row)).toEqual({
      id: 'report-1',
      commentContent: 'Comment',
      postContext: 'Post',
      reportText: 'Reason',
      reportedUser: {
        id: 'user-1',
        name: 'Reported User',
        role: 'STUDENT',
        warnings: 2,
        status: 'BLOCKED',
      },
      reporter: {
        id: 'user-2',
        name: 'Reporter',
        role: 'ADMIN',
        warnings: 0,
        status: 'ACTIVE',
      },
      reason: 'INSULT',
      status: 'OPEN',
      date: '2026-07-12T09:05:00.000Z',
    })
  })

  it('maps a bug-report row and preserves the unknown reporter fallback', () => {
    expect(
      toBugReport({
        id: 'bug-1',
        title: 'Broken page',
        description: 'The page does not load.',
        severity: 'HIGH',
        status: 'REVIEWED',
        reporter_name: null,
        reported_at: '2026-07-14T12:10:00.000Z',
      }),
    ).toEqual({
      id: 'bug-1',
      title: 'Broken page',
      description: 'The page does not load.',
      severity: 'HIGH',
      status: 'REVIEWED',
      reporterName: 'Unknown',
      reportedAt: '2026-07-14T12:10:00.000Z',
    })
  })
})

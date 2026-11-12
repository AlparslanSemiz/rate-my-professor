import type { MswDb } from './db'

/**
 * One record in every collection, with the ids the call-surface sweep addresses.
 *
 * Deliberately minimal and deliberately *complete*: the sweep asserts what the panel **sent**,
 * so the contents of a response matter only insofar as a handler needs something to find. What
 * does matter is that every collection is populated, because a handler answering `404` would
 * still record the request and the sweep would pass while proving less than it claims — the
 * write never reached anything.
 *
 * Separate from `demoData.ts`, which exists to be looked at in a browser and is long on
 * purpose. This one exists to be addressed.
 */

const AT = '2026-06-11T18:30:00Z'

const AUTHOR = {
  id: 'user-1',
  name: 'Mira Kowalski',
  role: 'STUDENT',
  warnings: 0,
  status: 'ACTIVE',
} as const

/** @returns the store the sweep seeds before every call */
export function sweepFixture(): Partial<MswDb> {
  return {
    users: [
      {
        id: 'user-1',
        username: 'Mira Kowalski',
        kitEmail: 'umira@student.kit.edu',
        role: 'STUDENT',
        status: 'ACTIVE',
        joined: '2025-01-10',
        lastOnline: AT,
        biography: '',
        warnings: 1,
        reports: 0,
        credibilityScore: 100,
      },
    ],
    warnings: {
      'user-1': [
        {
          id: 'warning-1',
          userID: 'user-1',
          message: 'Please keep it civil.',
          createdAt: AT,
          issuedBy: 'admin-1',
          issuedByName: 'Admin User',
        },
      ],
    },
    comments: [
      {
        id: 'content-1',
        content: 'Das Skript ist veraltet.',
        status: 'VISIBLE',
        author: AUTHOR,
        postContext: 'Programmieren',
        lectureId: 'lecture-1',
        answers: 0,
        reports: 1,
        createdAt: AT,
      },
    ],
    answers: [
      {
        id: 'content-1',
        content: 'Stimmt, Stand 2019.',
        status: 'VISIBLE',
        author: AUTHOR,
        commentId: 'comment-1',
        commentPreview: 'Das Skript ist veraltet.',
        postContext: 'Programmieren',
        reports: 1,
        createdAt: AT,
      },
    ],
    commentReports: [
      {
        id: 'report-1',
        commentId: 'content-1',
        commentContent: 'Das Skript ist veraltet.',
        postContext: 'Programmieren',
        reportText: 'Beleidigend.',
        reportedUser: AUTHOR,
        reporter: { ...AUTHOR, id: 'user-2', name: 'Jonas Weber' },
        reason: 'OFF_TOPIC',
        status: 'OPEN',
        date: AT,
      },
    ],
    answerReports: [
      {
        id: 'report-1',
        answerId: 'content-1',
        commentId: 'comment-1',
        answerContent: 'Stimmt, Stand 2019.',
        commentContent: 'Das Skript ist veraltet.',
        postContext: 'Programmieren',
        reportText: 'Beleidigend.',
        reportedUser: AUTHOR,
        reporter: { ...AUTHOR, id: 'user-2', name: 'Jonas Weber' },
        reason: 'OFF_TOPIC',
        status: 'OPEN',
        date: AT,
      },
    ],
    lectures: [
      {
        id: 'lecture-1',
        name: 'Programmieren',
        code: 'IN1IPRO',
        semesterYear: 2026,
        semesterSeason: 'WINTER',
        active: true,
        lectureType: 'LECTURE_AND_EXERCISE',
        professors: [
          { id: 'professor-1', firstName: 'Anna', lastName: 'Brandenburger', active: true },
        ],
        commentCount: 1,
        ratingCount: 1,
      },
    ],
    professors: [
      {
        id: 'professor-1',
        firstName: 'Anna',
        lastName: 'Brandenburger',
        active: true,
        lectureIds: ['lecture-1'],
        averageRating: 4.2,
        ratingCount: 1,
      },
    ],
    ratings: [
      {
        id: 'rating-1',
        lectureId: 'lecture-1',
        lectureLabel: 'IN1IPRO - Programmieren',
        createdAt: AT,
        student: { id: 'user-1', name: 'Mira Kowalski' },
        topics: [
          { category: 'CONTENT', value: 4 },
          { category: 'CLARITY', value: 5 },
        ],
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        action: 'USER_UPDATED',
        createdAt: AT,
        actor: {
          type: 'ADMIN',
          id: 'admin-1',
          name: 'Admin User',
          email: 'unzhz@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'USER', id: 'user-1', label: 'Mira Kowalski' },
        changes: { credibilityScore: { before: 80, after: 72 } },
        metadata: {},
        revertible: true,
        revertBlockedReason: null,
        revertedByAuditId: null,
      },
    ],
    auditMeta: {
      actors: [
        { id: 'admin-1', name: 'Admin User', email: 'unzhz@student.kit.edu', role: 'ADMIN' },
      ],
      actions: ['USER_UPDATED'],
      targetTypes: ['USER'],
      actorTypes: ['ADMIN'],
    },
    activityLogs: [
      {
        id: 'activity-1',
        // A refusal rather than a comment: it is the entry type with the most metadata and the
        // least in common with an audit entry, so a screen that renders this one renders the
        // rest. `changes` is empty because nothing existing was modified.
        action: 'ACCESS_REFUSED',
        createdAt: AT,
        actor: {
          type: 'USER',
          id: 'user-1',
          name: 'Mira Kowalski',
          email: 'mira@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'ENDPOINT', id: 'endpoint-1', label: 'GET /admin/users' },
        changes: {},
        metadata: { method: 'GET', path: '/admin/users', status: 403 },
      },
    ],
    activityMeta: {
      actors: [
        { id: 'user-1', name: 'Mira Kowalski', email: 'mira@student.kit.edu', role: 'STUDENT' },
      ],
      actions: ['ACCESS_REFUSED'],
      targetTypes: ['ENDPOINT'],
      actorTypes: ['USER'],
    },
    bugReports: [
      {
        id: 'report-1',
        title: 'Ratings do not load',
        description: 'The ratings tab stays empty.',
        severity: 'MEDIUM',
        status: 'OPEN',
        reporterName: 'Mira Kowalski',
        reportedAt: AT,
        issueUrl: null,
        issueState: 'NONE',
      },
    ],
    // The escalation endpoint answers `503` while this is false, so the sweep could not reach
    // `POST /reports/{id}/gitlab-issue` at all without it.
    gitlabEnabled: true,
    systemStatus: {
      status: 'OK',
      checkedAt: AT,
      startedAt: AT,
      uptimeSeconds: 3600,
      database: { reachable: true, latencyMs: 3, error: null },
      counts: { users: 1, activeUsers: 1, admins: 1, openBugReports: 1 },
      lastWrite: { at: AT, ageSeconds: 12, action: 'USER_UPDATED', actorName: 'Admin User' },
      gitlabEnabled: true,
    },
  }
}

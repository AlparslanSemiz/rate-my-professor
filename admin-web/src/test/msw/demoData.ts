import type { MswDb } from './db'

/**
 * The panel's content when it runs without a backend.
 *
 * Real KIT material, not placeholders: actual lecture titles, German names, and comments
 * written the way students write them. `docs/DESIGN.md` bans lorem ipsum and invented
 * statistics, and there is a second reason here — the previous fixtures were role labels
 * ("Reported text", "Hidden already") short enough that nothing ever exercised the two-line
 * clamp, the 90-character tooltip threshold or word-breaking on a long German compound.
 *
 * Rebuilt on every call, so nothing a run mutates leaks into the next one.
 */
export function demoBackend(): Partial<MswDb> {
  return {
    users: [
      {
        id: 'user-1',
        username: 'Lena Hoffmann',
        kitEmail: 'ulena@student.kit.edu',
        role: 'STUDENT',
        status: 'ACTIVE',
        joined: '2025-10-14',
        lastOnline: '2026-09-08T19:12:00Z',
        biography: 'Informatik, 3. Semester. Tutorin für GBI.',
        warnings: 1,
        reports: 2,
        credibilityScore: 72,
      },
      {
        id: 'user-2',
        username: 'Jonas Weber',
        kitEmail: 'ujonas@student.kit.edu',
        role: 'STUDENT',
        status: 'ACTIVE',
        joined: '2025-04-02',
        lastOnline: '2026-09-09T08:41:00Z',
        biography: 'Maschinenbau. Schreibt zu viele Kommentare.',
        warnings: 0,
        reports: 0,
        credibilityScore: 95,
      },
      {
        id: 'user-3',
        username: 'Mira Kowalski',
        kitEmail: 'umira@student.kit.edu',
        role: 'STUDENT',
        status: 'BLOCKED',
        joined: '2026-01-20',
        lastOnline: '2026-08-30T22:05:00Z',
        biography: '',
        warnings: 3,
        reports: 5,
        credibilityScore: 18,
      },
      {
        id: 'admin-1',
        username: 'Alparslan Semiz',
        kitEmail: 'unzhz@student.kit.edu',
        role: 'ADMIN',
        status: 'ACTIVE',
        joined: '2025-09-01',
        lastOnline: '2026-09-09T09:00:00Z',
        biography: 'Admin-Team.',
        warnings: 0,
        reports: 0,
        credibilityScore: 100,
      },
    ],
    warnings: {
      'user-1': [
        {
          id: 'warning-1',
          userID: 'user-1',
          message:
            'Bitte keine Klausurangaben aus dem Altklausurenarchiv wörtlich in Kommentare kopieren.',
          createdAt: '2026-07-02T14:20:00Z',
          issuedBy: 'admin-1',
          issuedByName: 'Alparslan Semiz',
        },
      ],
    },
    comments: [
      {
        id: 'comment-1',
        content:
          'Die Vorlesung ist inhaltlich gut aufgebaut, aber die Übungsblätter sind deutlich schwerer als alles, was in der Vorlesung vorgerechnet wird. Wer das ohne Tutorium schafft, hat meinen Respekt.',
        status: 'VISIBLE',
        author: {
          id: 'user-1',
          name: 'Lena Hoffmann',
          role: 'STUDENT',
          warnings: 1,
          status: 'ACTIVE',
        },
        postContext: 'Grundbegriffe der Informatik',
        lectureId: 'lecture-1',
        answers: 1,
        reports: 1,
        createdAt: '2026-08-14T11:32:00Z',
      },
      {
        id: 'comment-2',
        content: 'Skript ist auf dem Stand von 2019, die Notation stimmt nicht mehr mit den Folien überein.',
        status: 'VISIBLE',
        author: {
          id: 'user-2',
          name: 'Jonas Weber',
          role: 'STUDENT',
          warnings: 0,
          status: 'ACTIVE',
        },
        postContext: 'Lineare Algebra I',
        lectureId: 'lecture-2',
        answers: 0,
        reports: 0,
        createdAt: '2026-08-11T09:05:00Z',
      },
      {
        id: 'comment-3',
        content: 'Völlig unbrauchbare Veranstaltung, der Dozent sollte den Job wechseln.',
        status: 'HIDDEN',
        author: {
          id: 'user-3',
          name: 'Mira Kowalski',
          role: 'STUDENT',
          warnings: 3,
          status: 'BLOCKED',
        },
        postContext: 'Theoretische Grundlagen der Informatik',
        lectureId: 'lecture-3',
        answers: 0,
        reports: 2,
        createdAt: '2026-08-09T17:48:00Z',
      },
    ],
    answers: [
      {
        id: 'answer-1',
        content: 'Das Tutorium von Frau Brandenburger hilft da sehr, die rechnen die Blätter fast komplett vor.',
        status: 'VISIBLE',
        author: {
          id: 'user-2',
          name: 'Jonas Weber',
          role: 'STUDENT',
          warnings: 0,
          status: 'ACTIVE',
        },
        commentId: 'comment-1',
        commentPreview: 'Die Vorlesung ist inhaltlich gut aufgebaut …',
        postContext: 'Grundbegriffe der Informatik',
        reports: 0,
        createdAt: '2026-08-14T13:10:00Z',
      },
    ],
    commentReports: [
      {
        id: 'report-1',
        commentId: 'comment-3',
        commentContent: 'Völlig unbrauchbare Veranstaltung, der Dozent sollte den Job wechseln.',
        postContext: 'Theoretische Grundlagen der Informatik',
        reportText: 'Persönlicher Angriff auf den Dozenten, kein inhaltlicher Bezug.',
        reportedUser: {
          id: 'user-3',
          name: 'Mira Kowalski',
          role: 'STUDENT',
          warnings: 3,
          status: 'BLOCKED',
        },
        reporter: {
          id: 'user-2',
          name: 'Jonas Weber',
          role: 'STUDENT',
          warnings: 0,
          status: 'ACTIVE',
        },
        reason: 'INSULT',
        status: 'OPEN',
        date: '2026-08-10T08:15:00Z',
      },
      {
        id: 'report-2',
        commentId: 'comment-1',
        commentContent: 'Die Vorlesung ist inhaltlich gut aufgebaut …',
        postContext: 'Grundbegriffe der Informatik',
        reportText: 'Enthält Angaben aus einer Altklausur.',
        reportedUser: {
          id: 'user-1',
          name: 'Lena Hoffmann',
          role: 'STUDENT',
          warnings: 1,
          status: 'ACTIVE',
        },
        reporter: {
          id: 'user-2',
          name: 'Jonas Weber',
          role: 'STUDENT',
          warnings: 0,
          status: 'ACTIVE',
        },
        reason: 'OFF_TOPIC',
        status: 'REVIEWED',
        date: '2026-08-15T10:02:00Z',
      },
    ],
    answerReports: [],
    bugReports: [
      {
        id: 'bug-1',
        title: 'Bewertung lässt sich auf dem Handy nicht abschicken',
        description:
          'Auf dem iPhone bleibt der Button "Bewertung abschicken" grau, obwohl alle Kategorien ausgefüllt sind. Im Desktop-Browser funktioniert es.',
        severity: 'HIGH',
        status: 'OPEN',
        reporterName: 'Lena Hoffmann',
        reportedAt: '2026-09-01T16:44:00Z',
        issueUrl: null,
        issueState: 'NONE',
      },
      {
        id: 'bug-2',
        title: 'Semesterfilter zeigt Wintersemester doppelt',
        description: 'In der Vorlesungsliste erscheint "Winter 2026" zweimal im Dropdown.',
        severity: 'LOW',
        status: 'REVIEWED',
        reporterName: 'Jonas Weber',
        reportedAt: '2026-08-27T12:10:00Z',
        issueUrl: null,
        issueState: 'NONE',
      },
    ],
    gitlabEnabled: true,
    /**
     * Real KIT lectures, and the reason they are here at all: **the demo backend served none.**
     * Every catalogue measurement the browser layer has ever taken was taken against a table
     * with a header and no rows, and the catalogue's edit and delete modals were unreachable in
     * a browser — nothing could click a row action that was never drawn. `F-041`.
     *
     * `Lineare Algebra I` is deliberately inactive: the catalogue's own notice about
     * deactivated rows had no row to show it for either.
     */
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
        commentCount: 2,
        ratingCount: 2,
      },
      {
        id: 'lecture-2',
        name: 'Lineare Algebra I',
        code: 'MATHIN1',
        semesterYear: 2025,
        semesterSeason: 'WINTER',
        active: false,
        lectureType: 'LECTURE_ONLY',
        professors: [
          { id: 'professor-2', firstName: 'Jürgen', lastName: 'Kellermann', active: true },
        ],
        commentCount: 1,
        ratingCount: 1,
      },
      {
        id: 'lecture-3',
        name: 'Grundlagen der Rechnernetze und verteilten Systeme',
        code: 'IN1GRNVS',
        semesterYear: 2026,
        semesterSeason: 'SUMMER',
        active: true,
        lectureType: 'LECTURE_AND_EXERCISE',
        professors: [
          { id: 'professor-1', firstName: 'Anna', lastName: 'Brandenburger', active: true },
          { id: 'professor-3', firstName: 'Sofia', lastName: 'Weiß-Lindemann', active: true },
        ],
        commentCount: 0,
        ratingCount: 1,
      },
    ],
    professors: [
      {
        id: 'professor-1',
        firstName: 'Anna',
        lastName: 'Brandenburger',
        active: true,
        lectureIds: ['lecture-1', 'lecture-3'],
        averageRating: 4.2,
        ratingCount: 3,
      },
      {
        id: 'professor-2',
        firstName: 'Jürgen',
        lastName: 'Kellermann',
        active: true,
        lectureIds: ['lecture-2'],
        averageRating: 2.8,
        ratingCount: 1,
      },
      {
        id: 'professor-3',
        firstName: 'Sofia',
        lastName: 'Weiß-Lindemann',
        active: false,
        lectureIds: ['lecture-3'],
        averageRating: 0,
        ratingCount: 0,
      },
    ],
    ratings: [
      {
        id: 'rating-1',
        lectureId: 'lecture-1',
        lectureLabel: 'IN1IPRO - Programmieren',
        createdAt: '2026-09-07T11:20:00Z',
        student: { id: 'user-1', name: 'Lena Hoffmann' },
        topics: [
          { category: 'CONTENT', value: 4 },
          { category: 'CLARITY', value: 5 },
          { category: 'DIFFICULTY', value: 3 },
        ],
      },
      {
        id: 'rating-2',
        lectureId: 'lecture-2',
        lectureLabel: 'MATHIN1 - Lineare Algebra I',
        createdAt: '2026-09-05T16:45:00Z',
        student: { id: 'user-3', name: 'Mira Kowalski' },
        topics: [
          { category: 'CONTENT', value: 2 },
          { category: 'CLARITY', value: 3 },
          { category: 'DIFFICULTY', value: 5 },
        ],
      },
    ],
    auditMeta: {
      actors: [
        {
          id: 'admin-1',
          name: 'Alparslan Semiz',
          email: 'unzhz@student.kit.edu',
          role: 'ADMIN',
        },
      ],
      actions: ['ADMIN_LOGIN', 'USER_BLOCKED', 'USER_UPDATED'],
      targetTypes: ['ADMIN_SESSION', 'USER'],
      actorTypes: ['ADMIN'],
    },
    auditLogs: [
      {
        id: 'audit-1',
        action: 'USER_UPDATED',
        createdAt: '2026-09-08T15:04:00Z',
        actor: {
          type: 'ADMIN',
          id: 'admin-1',
          name: 'Alparslan Semiz',
          email: 'unzhz@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'USER', id: 'user-1', label: 'Lena Hoffmann (ulena@student.kit.edu)' },
        changes: { credibilityScore: { before: 80, after: 72 } },
        metadata: { reason: 'Wiederholte Verstöße gegen die Kommentarregeln' },
        revertible: true,
        revertBlockedReason: null,
        revertedByAuditId: null,
      },
      {
        id: 'audit-2',
        action: 'USER_BLOCKED',
        createdAt: '2026-08-30T22:31:00Z',
        actor: {
          type: 'ADMIN',
          id: 'admin-1',
          name: 'Alparslan Semiz',
          email: 'unzhz@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'USER', id: 'user-3', label: 'Mira Kowalski (umira@student.kit.edu)' },
        changes: { status: { before: 'ACTIVE', after: 'BLOCKED' } },
        metadata: { reason: 'Beleidigung eines Dozenten' },
        revertible: true,
        revertBlockedReason: null,
        revertedByAuditId: null,
      },
      {
        id: 'audit-3',
        action: 'ADMIN_LOGIN',
        createdAt: '2026-08-30T22:28:00Z',
        actor: {
          type: 'ADMIN',
          id: 'admin-1',
          name: 'Alparslan Semiz',
          email: 'unzhz@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'ADMIN_SESSION', id: 'admin-1', label: 'Alparslan Semiz admin session' },
        changes: {},
        metadata: { method: 'EMAIL_OTP' },
        revertible: false,
        revertBlockedReason: 'ACTION_NOT_REVERTIBLE',
        revertedByAuditId: null,
      },
    ],
    activityMeta: {
      actors: [
        { id: 'user-1', name: 'Lena Hoffmann', email: 'ulena@student.kit.edu', role: 'STUDENT' },
        { id: 'user-3', name: 'Mira Kowalski', email: 'umira@student.kit.edu', role: 'STUDENT' },
      ],
      actions: [
        'ACCESS_REFUSED',
        'ANSWER_CREATED',
        'COMMENT_CREATED',
        'COMMENT_REPORT_CREATED',
        'LOGIN_REFUSED',
        'RATING_SUBMITTED',
        'USER_LOGIN',
      ],
      targetTypes: ['ANSWER', 'COMMENT', 'COMMENT_REPORT', 'ENDPOINT', 'RATING', 'USER_SESSION'],
      actorTypes: ['ADMIN', 'USER'],
    },
    /**
     * One of each shape the activity screen has to draw, rather than a realistic distribution:
     * a contribution with a preview, a sign-in with its method, a rating with no detail at all,
     * a report, and both refusals. The last two are the reason the screen exists and the two
     * nothing reaches by clicking.
     */
    activityLogs: [
      {
        id: 'activity-1',
        action: 'COMMENT_CREATED',
        createdAt: '2026-09-09T08:41:00Z',
        actor: {
          type: 'USER',
          id: 'user-1',
          name: 'Lena Hoffmann',
          email: 'ulena@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'COMMENT', id: 'comment-1', label: 'Programmieren - Vorlesung' },
        changes: {},
        metadata: {
          contentPreview: 'Die Übungsblätter sind gut, aber die Tutorien sind überfüllt.',
          contentLength: 61,
        },
      },
      {
        id: 'activity-2',
        action: 'LOGIN_REFUSED',
        createdAt: '2026-09-09T08:12:00Z',
        actor: {
          type: 'USER',
          id: 'user-3',
          name: 'Mira Kowalski',
          email: 'umira@student.kit.edu',
          role: 'STUDENT',
        },
        target: null,
        changes: {},
        metadata: { reason: 'ACCOUNT_BLOCKED', method: 'EMAIL_OTP' },
      },
      {
        id: 'activity-3',
        action: 'ACCESS_REFUSED',
        createdAt: '2026-09-09T08:11:00Z',
        actor: {
          type: 'USER',
          id: 'user-1',
          name: 'Lena Hoffmann',
          email: 'ulena@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'ENDPOINT', id: 'endpoint-users', label: 'GET /users' },
        changes: {},
        metadata: { method: 'GET', path: '/users', status: 403 },
      },
      {
        id: 'activity-4',
        action: 'RATING_SUBMITTED',
        createdAt: '2026-09-08T19:55:00Z',
        actor: {
          type: 'USER',
          id: 'user-3',
          name: 'Mira Kowalski',
          email: 'umira@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'RATING', id: 'rating-1', label: 'Lineare Algebra I' },
        changes: {},
        // Nothing recorded beyond the action, which is the case the details modal has its own
        // sentence for.
        metadata: {},
      },
      {
        id: 'activity-5',
        action: 'COMMENT_REPORT_CREATED',
        createdAt: '2026-09-08T14:02:00Z',
        actor: {
          type: 'USER',
          id: 'user-1',
          name: 'Lena Hoffmann',
          email: 'ulena@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'COMMENT_REPORT', id: 'report-1', label: 'Beleidigung eines Dozenten' },
        changes: {},
        metadata: { reason: 'INSULT' },
      },
      {
        id: 'activity-6',
        action: 'USER_LOGIN',
        createdAt: '2026-09-08T07:30:00Z',
        actor: {
          type: 'USER',
          id: 'user-1',
          name: 'Lena Hoffmann',
          email: 'ulena@student.kit.edu',
          role: 'STUDENT',
        },
        target: { type: 'USER_SESSION', id: 'session-9', label: 'Lena Hoffmann app session' },
        changes: {},
        metadata: { method: 'EMAIL_OTP', newAccount: false, api: 'APP' },
      },
    ],
    systemStatus: {
      status: 'OK',
      checkedAt: '2026-09-09T09:00:00Z',
      startedAt: '2026-09-08T06:00:00Z',
      uptimeSeconds: 97200,
      database: { reachable: true, latencyMs: 4, error: null },
      counts: { users: 4, activeUsers: 3, admins: 1, openBugReports: 1 },
      lastWrite: {
        at: '2026-09-08T15:04:00Z',
        ageSeconds: 64560,
        action: 'USER_UPDATED',
        actorName: 'Alparslan Semiz',
      },
      gitlabEnabled: true,
    },
  }
}

/**
 * The address the demo signs in with, and who `/auth/me` then reports.
 *
 * It has to be one of the six in `src/utils/adminAccess.ts`: the panel refuses to request a
 * code for anything else, before the backend is asked at all.
 */
export const DEMO_ADMIN = {
  email: 'unzhz@student.kit.edu',
  session: {
    id: 'admin-1',
    username: 'Alparslan Semiz',
    kitEmail: 'unzhz@student.kit.edu',
    role: 'ADMIN',
    isSuperAdmin: true,
  },
} as const

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
        kitEmail: 'u-kisi2@student.kit.edu',
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
        kitEmail: 'u-kisi3@student.kit.edu',
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
        kitEmail: 'u-kisi4@student.kit.edu',
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
    auditMeta: {
      actors: [
        {
          id: 'admin-1',
          name: 'Alparslan Semiz',
          email: 'u-kisi4@student.kit.edu',
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
          email: 'u-kisi4@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'USER', id: 'user-1', label: 'Lena Hoffmann (u-kisi2@student.kit.edu)' },
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
          email: 'u-kisi4@student.kit.edu',
          role: 'ADMIN',
        },
        target: { type: 'USER', id: 'user-3', label: 'Mira Kowalski (u-kisi3@student.kit.edu)' },
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
          email: 'u-kisi4@student.kit.edu',
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
  email: 'u-kisi4@student.kit.edu',
  session: {
    id: 'admin-1',
    username: 'Alparslan Semiz',
    kitEmail: 'u-kisi4@student.kit.edu',
    role: 'ADMIN',
    isSuperAdmin: true,
  },
} as const

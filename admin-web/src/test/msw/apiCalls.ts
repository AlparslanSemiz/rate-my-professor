import { authService } from '@/api/auth'
import { catalogService, ratingsService } from '@/api/catalog'
import { feedbackService } from '@/api/feedback'
import { activityLogsService, auditLogsService } from '@/api/logs'
import { answersService, commentsService } from '@/api/moderation'
import { systemStatusService } from '@/api/system'
import { usersService } from '@/api/users'

/**
 * Every request the panel can make, as data.
 *
 * One list, read by two layers that ask different questions of it — the call-surface sweep
 * (`src/api/callSurface.integration.test.ts`) asks *what did we send*, and the response-shape
 * layer (`src/api/responseShapes.integration.test.ts`) asks *what do we do when the answer is
 * wrong*. Keeping the endpoints in one place is the whole point: a second list would be a
 * second thing to forget to update, which is the failure the sweep exists to prevent one level
 * up.
 */

/** One call, and everything about the request it should produce. */
export interface ApiCall {
  /** Reads as the test name. */
  readonly name: string
  readonly method: string
  /** The path, without query string and without the base. */
  readonly path: string
  /** The exact query string, or `undefined` when none should be sent at all. */
  readonly query?: string
  /** The parsed JSON body, or `undefined` for a request that should carry none. */
  readonly body?: unknown
  /**
   * `null` means the header is expected to be **absent**, which is the interesting value —
   * see `F-023`. `bodylessWrites.integration.test.ts` keeps the `415` behaviour; the header
   * claim itself lives here now, once per call rather than only for the five.
   */
  readonly contentType: string | null
  /** The `Class.method` ids this row exercises, which is what the ratchet reads. */
  readonly covers: readonly string[]
  readonly send: () => Promise<unknown>
}

const JSON_TYPE = 'application/json'

const CALLS: readonly ApiCall[] = [
  // -- auth -----------------------------------------------------------------------------
  {
    name: 'requestLoginCode',
    method: 'POST',
    path: '/auth/request-login',
    body: { email: 'unzhz@student.kit.edu' },
    contentType: JSON_TYPE,
    covers: ['AuthService.requestLoginCode', 'LoginCodeService.requestCode'],
    send: () => authService.requestLoginCode('unzhz@student.kit.edu'),
  },
  {
    name: 'login',
    method: 'POST',
    path: '/auth/login',
    body: { email: 'unzhz@student.kit.edu', loginToken: '123456' },
    contentType: JSON_TYPE,
    covers: ['AuthService.login', 'TokenLoginService.login'],
    send: () => authService.login('unzhz@student.kit.edu', '123456'),
  },
  {
    name: 'logout',
    method: 'POST',
    path: '/auth/logout',
    contentType: null,
    covers: ['AuthService.logout', 'AuthSessionService.logout'],
    send: () => authService.logout(),
  },
  {
    name: 'me',
    method: 'GET',
    path: '/auth/me',
    contentType: null,
    covers: ['AuthService.me', 'AuthSessionService.me'],
    send: () => authService.me(),
  },

  // -- users ----------------------------------------------------------------------------
  {
    name: 'users.list with no query',
    method: 'GET',
    path: '/users',
    contentType: null,
    covers: ['UsersService.list', 'UserAccountsService.list'],
    send: () => usersService.list(),
  },
  {
    name: 'users.list drops an empty search box',
    method: 'GET',
    path: '/users',
    // `q: ''` is what an untouched search box holds. Sending `q=` asks the backend to filter
    // for nothing rather than to filter not at all, so the client drops it — and this row is
    // where that claim is checked against a real URL rather than against the client's own unit.
    query: 'limit=50&status=ACTIVE',
    contentType: null,
    covers: ['UsersService.list', 'UserAccountsService.list'],
    send: () => usersService.list({ limit: 50, q: '', status: 'ACTIVE' }),
  },
  {
    name: 'users.getAll',
    method: 'GET',
    path: '/users',
    contentType: null,
    covers: ['UsersService.getAll', 'UserAccountsService.getAll'],
    send: () => usersService.getAll(),
  },
  {
    name: 'users.getById',
    method: 'GET',
    path: '/users/user-1',
    contentType: null,
    covers: ['UsersService.getById', 'UserAccountsService.getById'],
    send: () => usersService.getById('user-1'),
  },
  {
    name: 'users.update',
    method: 'PATCH',
    path: '/users/user-1',
    body: { credibilityScore: 72 },
    contentType: JSON_TYPE,
    covers: ['UsersService.update', 'UserAccountsService.update'],
    send: () => usersService.update('user-1', { credibilityScore: 72 }),
  },
  {
    name: 'users.delete',
    method: 'DELETE',
    path: '/users/user-1',
    contentType: null,
    covers: ['UsersService.delete', 'UserAccountsService.delete'],
    send: () => usersService.delete('user-1'),
  },
  {
    name: 'users.block',
    method: 'PATCH',
    path: '/users/user-1/block',
    contentType: null,
    covers: ['UsersService.block', 'UserAccountsService.block'],
    send: () => usersService.block('user-1'),
  },
  {
    name: 'users.unblock',
    method: 'PATCH',
    path: '/users/user-1/unblock',
    contentType: null,
    covers: ['UsersService.unblock', 'UserAccountsService.unblock'],
    send: () => usersService.unblock('user-1'),
  },
  {
    name: 'users.warn',
    method: 'POST',
    path: '/users/user-1/warnings',
    body: { message: 'Please keep it civil.' },
    contentType: JSON_TYPE,
    covers: ['UsersService.warn', 'UserWarningsService.warn'],
    send: () => usersService.warn('user-1', 'Please keep it civil.'),
  },
  {
    name: 'users.getWarnings',
    method: 'GET',
    path: '/users/user-1/warnings',
    contentType: null,
    covers: ['UsersService.getWarnings', 'UserWarningsService.getWarnings'],
    send: () => usersService.getWarnings('user-1'),
  },
  {
    name: 'users.updateWarning',
    method: 'PATCH',
    path: '/users/user-1/warnings/warning-1',
    body: { message: 'Corrected wording.' },
    contentType: JSON_TYPE,
    covers: ['UsersService.updateWarning', 'UserWarningsService.updateWarning'],
    send: () => usersService.updateWarning('user-1', 'warning-1', 'Corrected wording.'),
  },
  {
    name: 'users.deleteWarning',
    method: 'DELETE',
    path: '/users/user-1/warnings/warning-1',
    contentType: null,
    covers: ['UsersService.deleteWarning', 'UserWarningsService.deleteWarning'],
    send: () => usersService.deleteWarning('user-1', 'warning-1'),
  },

  // -- catalogue ------------------------------------------------------------------------
  {
    name: 'catalog.getLectures',
    method: 'GET',
    // The admin read, not the public one. `/data/lectures` filters to `active = true`; the
    // panel needs the inactive rows to be able to switch one back on. `F-006`.
    path: '/data/lectures/all',
    contentType: null,
    covers: ['CatalogService.getLectures', 'LectureCatalogService.getAll'],
    send: () => catalogService.getLectures(),
  },
  {
    name: 'catalog.updateLecture',
    method: 'PATCH',
    path: '/data/lectures/lecture-1',
    body: { active: false },
    contentType: JSON_TYPE,
    covers: ['CatalogService.updateLecture', 'LectureCatalogService.update'],
    send: () => catalogService.updateLecture('lecture-1', { active: false }),
  },
  {
    name: 'catalog.deleteLecture',
    method: 'DELETE',
    path: '/data/lectures/lecture-1',
    contentType: null,
    covers: ['CatalogService.deleteLecture', 'LectureCatalogService.delete'],
    send: () => catalogService.deleteLecture('lecture-1'),
  },
  {
    name: 'catalog.getProfessors',
    method: 'GET',
    // Singular, and not a typo: the backend serves the professor catalogue at `/data/professor`
    // while lectures are plural. A sweep that normalised it would hide the asymmetry.
    // `/all` for the same reason as the lecture read above.
    path: '/data/professor/all',
    contentType: null,
    covers: ['CatalogService.getProfessors', 'ProfessorCatalogService.getAll'],
    send: () => catalogService.getProfessors(),
  },
  {
    name: 'catalog.updateProfessor',
    method: 'PATCH',
    path: '/data/professor/professor-1',
    body: { lectureIds: ['lecture-1'] },
    contentType: JSON_TYPE,
    covers: ['CatalogService.updateProfessor', 'ProfessorCatalogService.update'],
    send: () => catalogService.updateProfessor('professor-1', { lectureIds: ['lecture-1'] }),
  },
  {
    name: 'catalog.deleteProfessor',
    method: 'DELETE',
    path: '/data/professor/professor-1',
    contentType: null,
    covers: ['CatalogService.deleteProfessor', 'ProfessorCatalogService.delete'],
    send: () => catalogService.deleteProfessor('professor-1'),
  },
  {
    name: 'ratings.list with no query',
    method: 'GET',
    path: '/ratings',
    contentType: null,
    covers: ['RatingsService.list', 'RatingReadService.list'],
    send: () => ratingsService.list(),
  },
  {
    name: 'ratings.list with a lecture and a cursor',
    method: 'GET',
    path: '/ratings',
    query: 'limit=50&cursor=rating-1&lectureId=lecture-1',
    contentType: null,
    covers: ['RatingsService.list', 'RatingReadService.list'],
    send: () => ratingsService.list({ limit: 50, cursor: 'rating-1', lectureId: 'lecture-1' }),
  },
  {
    name: 'ratings.delete',
    method: 'DELETE',
    path: '/ratings/rating-1',
    contentType: null,
    covers: ['RatingsService.delete', 'RatingDeletionService.delete'],
    send: () => ratingsService.delete('rating-1'),
  },

  // -- audit log ------------------------------------------------------------------------
  {
    name: 'auditLogs.getLogs with no filters',
    method: 'GET',
    path: '/audit-logs',
    // `limit` is always sent, even with no filters at all: `toLogQueryParams` defaults it.
    query: 'limit=50',
    contentType: null,
    covers: ['AuditLogsService.getLogs', 'LogReaderService.getLogs'],
    send: () => auditLogsService.getLogs(),
  },
  {
    name: 'auditLogs.getLogs drops a blank search and keeps the rest',
    method: 'GET',
    path: '/audit-logs',
    query: 'limit=50&cursor=audit-1&action=USER_UPDATED',
    contentType: null,
    covers: ['AuditLogsService.getLogs', 'LogReaderService.getLogs'],
    send: () => auditLogsService.getLogs({ q: '   ', action: 'USER_UPDATED' }, 'audit-1'),
  },
  {
    name: 'auditLogs.getMeta',
    method: 'GET',
    path: '/audit-logs/meta',
    contentType: null,
    covers: ['AuditLogsService.getMeta', 'LogMetaService.getMeta'],
    send: () => auditLogsService.getMeta(),
  },
  {
    name: 'auditLogs.revert',
    method: 'POST',
    path: '/audit-logs/audit-1/revert',
    contentType: null,
    covers: ['AuditLogsService.revert', 'AuditLogRevertService.revert'],
    send: () => auditLogsService.revert('audit-1'),
  },

  // -- activity log ---------------------------------------------------------------------
  // The same reader and the same meta service as above, pointed at the other resource, which
  // is why `covers` names the same two methods: what these rows establish is that the second
  // `LogResource` produces the second endpoint's path and query, not that a second class
  // exists.
  {
    name: 'activityLogs.getLogs with no filters',
    method: 'GET',
    path: '/activity-logs',
    query: 'limit=50',
    contentType: null,
    covers: ['ActivityLogsService.getLogs', 'LogReaderService.getLogs'],
    send: () => activityLogsService.getLogs(),
  },
  {
    name: 'activityLogs.getLogs sends the actor type the audit screen never asks for',
    method: 'GET',
    path: '/activity-logs',
    query: 'limit=50&cursor=activity-1&actorType=USER&action=ACCESS_REFUSED',
    contentType: null,
    covers: ['ActivityLogsService.getLogs', 'LogReaderService.getLogs'],
    send: () =>
      activityLogsService.getLogs({ actorType: 'USER', action: 'ACCESS_REFUSED' }, 'activity-1'),
  },
  {
    name: 'activityLogs.getMeta',
    method: 'GET',
    path: '/activity-logs/meta',
    contentType: null,
    covers: ['ActivityLogsService.getMeta', 'LogMetaService.getMeta'],
    send: () => activityLogsService.getMeta(),
  },

  // -- system ---------------------------------------------------------------------------
  {
    name: 'systemStatus.getStatus',
    method: 'GET',
    path: '/system/status',
    contentType: null,
    covers: ['SystemStatusService.getStatus'],
    send: () => systemStatusService.getStatus(),
  },

  // -- feedback -------------------------------------------------------------------------
  {
    name: 'feedback.getReports',
    method: 'GET',
    path: '/reports',
    contentType: null,
    covers: ['FeedbackService.getReports', 'BugReportsService.getReports'],
    send: () => feedbackService.getReports(),
  },
  {
    name: 'feedback.updateReport',
    method: 'PATCH',
    path: '/reports/report-1',
    body: { status: 'REVIEWED' },
    contentType: JSON_TYPE,
    covers: ['FeedbackService.updateReport', 'BugReportsService.updateReport'],
    send: () => feedbackService.updateReport('report-1', { status: 'REVIEWED' }),
  },
  {
    name: 'feedback.deleteReport',
    method: 'DELETE',
    path: '/reports/report-1',
    contentType: null,
    covers: ['FeedbackService.deleteReport', 'BugReportsService.deleteReport'],
    send: () => feedbackService.deleteReport('report-1'),
  },
  {
    name: 'feedback.createGitlabIssue',
    method: 'POST',
    path: '/reports/report-1/gitlab-issue',
    contentType: null,
    covers: ['FeedbackService.createGitlabIssue', 'GitlabIssueService.createIssue'],
    send: () => feedbackService.createGitlabIssue('report-1'),
  },
]

/**
 * `/comments/**` and `/answers/**` are the same six endpoints with the noun substituted, and
 * one string decides both the path segment and the key the list arrives under. Writing the
 * rows out twice would let the two drift apart in the test the way they cannot in the code.
 */
export const MODERATED = [
  { resource: 'comments', service: commentsService, klass: 'CommentsService' },
  { resource: 'answers', service: answersService, klass: 'AnswersService' },
] as const

const MODERATION_CALLS: readonly ApiCall[] = MODERATED.flatMap(({ resource, service, klass }): ApiCall[] => [
  {
    name: `${resource}.getAll`,
    method: 'GET',
    path: `/${resource}`,
    contentType: null,
    covers: [`${klass}.getAll`, 'ModerationService.getAll', 'ContentService.getAll'],
    send: () => service.getAll(),
  },
  {
    name: `${resource}.update`,
    method: 'PATCH',
    path: `/${resource}/content-1`,
    body: { status: 'HIDDEN' },
    contentType: JSON_TYPE,
    covers: [`${klass}.update`, 'ModerationService.update', 'ContentService.update'],
    send: () => service.update('content-1', { status: 'HIDDEN' }),
  },
  {
    name: `${resource}.delete`,
    method: 'DELETE',
    path: `/${resource}/content-1`,
    contentType: null,
    covers: [`${klass}.delete`, 'ModerationService.delete', 'ContentService.delete'],
    send: () => service.delete('content-1'),
  },
  {
    name: `${resource}.getReported`,
    method: 'GET',
    path: `/${resource}/reported`,
    contentType: null,
    covers: [`${klass}.getReported`, 'ModerationService.getReported', 'ReportsService.getReported'],
    send: () => service.getReported(),
  },
  {
    name: `${resource}.updateStatus`,
    method: 'PATCH',
    path: `/${resource}/reported/report-1`,
    body: { status: 'ACTION_TAKEN' },
    contentType: JSON_TYPE,
    covers: [`${klass}.updateStatus`, 'ModerationService.updateStatus', 'ReportsService.updateStatus'],
    send: () => service.updateStatus('report-1', 'ACTION_TAKEN'),
  },
  {
    name: `${resource}.deleteReport`,
    method: 'DELETE',
    path: `/${resource}/reported/report-1`,
    contentType: null,
    covers: [`${klass}.deleteReport`, 'ModerationService.deleteReport', 'ReportsService.deleteReport'],
    send: () => service.deleteReport('report-1'),
  },
])


/** The whole surface: the individually written calls, plus the two moderated nouns. */
export const API_CALLS: readonly ApiCall[] = [...CALLS, ...MODERATION_CALLS]

/**
 * The same list with one entry per endpoint.
 *
 * Several endpoints appear twice above, because a query string is worth asserting more than
 * once — `/users` with no parameters and `/users` with an empty search box are two different
 * requests. They are one endpoint, and a layer asking what a `503` does to it should ask once.
 */
export const API_ENDPOINTS: readonly ApiCall[] = API_CALLS.filter(
  (call, index) =>
    API_CALLS.findIndex((other) => other.method === call.method && other.path === call.path) === index,
)

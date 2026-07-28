export const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'Alparslan',
    kitEmail: 'u-kisi4@student.kit.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    joined: '2026-06-20T09:00:00.000Z',
    lastOnline: '2026-07-14T15:25:00.000Z',
    biography: 'Demo admin account for local moderation.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'MiraK',
    kitEmail: 'mira@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2026-06-24T10:30:00.000Z',
    lastOnline: '2026-07-14T13:45:00.000Z',
    biography: 'Computer science student. Usually helpful in lecture threads.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    username: 'JonasB',
    kitEmail: 'jonas@student.kit.edu',
    role: 'STUDENT',
    status: 'BLOCKED',
    joined: '2026-06-28T12:15:00.000Z',
    lastOnline: '2026-07-12T08:20:00.000Z',
    biography: 'Account currently blocked after repeated reports.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    username: 'LeylaS',
    kitEmail: 'leyla@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2026-07-02T16:20:00.000Z',
    lastOnline: '2026-07-14T14:58:00.000Z',
    biography: 'Frequent reporter and active participant.',
  },
]

export const warnings = [
  {
    id: 'aaaaaaaa-1111-1111-1111-111111111111',
    userId: '33333333-3333-3333-3333-333333333333',
    message: 'Please keep discussion focused on course content.',
    createdAt: '2026-07-10T11:10:00.000Z',
    createdFrom: '11111111-1111-1111-1111-111111111111',
  },
]

export const commentReports = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    commentContent: 'This lecture thread went off topic and includes personal attacks.',
    postContext: 'Software Engineering Practice',
    reportText: 'Contains hostile language toward another student.',
    reportedUserId: '33333333-3333-3333-3333-333333333333',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reason: 'INSULT',
    status: 'OPEN',
    date: '2026-07-13T15:40:00.000Z',
  },
  {
    id: '99999999-9999-9999-9999-999999999998',
    commentContent: 'Can someone share the exercise sheet solution?',
    postContext: 'Algorithms II',
    reportText: 'Possible academic integrity issue.',
    reportedUserId: '22222222-2222-2222-2222-222222222222',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reason: 'OTHER',
    status: 'REVIEWED',
    date: '2026-07-12T09:05:00.000Z',
  },
]

export const bugReports = [
  {
    id: '12121212-1212-1212-1212-121212121212',
    title: 'Dashboard count does not refresh',
    description: 'After resolving a comment report the dashboard cards still show the old number until a reload.',
    severity: 'MEDIUM',
    status: 'OPEN',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reportedAt: '2026-07-14T12:10:00.000Z',
  },
  {
    id: '13131313-1313-1313-1313-131313131313',
    title: 'Profile modal closes on slow network',
    description: 'When the user detail request is slow the modal occasionally closes before content loads.',
    severity: 'LOW',
    status: 'REVIEWED',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reportedAt: '2026-07-12T17:30:00.000Z',
  },
]

export const auditLogs = [
  {
    id: 'abababab-1111-1111-1111-111111111111',
    action: 'USER_WARNING_CREATED',
    target: {
      type: 'USER',
      id: '33333333-3333-3333-3333-333333333333',
      label: 'JonasB (jonas@student.kit.edu)',
    },
    changes: {
      warnings: { before: 0, after: 1 },
    },
    metadata: {
      reason: 'Please keep discussion focused on course content.',
    },
    createdAt: '2026-07-10T11:10:00.000Z',
  },
  {
    id: 'abababab-2222-2222-2222-222222222222',
    action: 'COMMENT_REPORT_STATUS_CHANGED',
    target: {
      type: 'COMMENT_REPORT',
      id: '99999999-9999-9999-9999-999999999998',
      label: 'Report about MiraK in Algorithms II',
    },
    changes: {
      status: { before: 'OPEN', after: 'REVIEWED' },
    },
    metadata: {},
    createdAt: '2026-07-12T10:15:00.000Z',
  },
  {
    id: 'abababab-3333-3333-3333-333333333333',
    action: 'ADMIN_LOGIN',
    target: {
      type: 'ADMIN_SESSION',
      id: '11111111-1111-1111-1111-111111111111',
      label: 'Alparslan admin session',
    },
    changes: {
      authenticated: { before: false, after: true },
    },
    metadata: {
      method: 'EMAIL_OTP',
    },
    createdAt: '2026-07-14T15:25:00.000Z',
  },
]

/**
 * Application-wide activity, as opposed to the admin-only audit trail above. `actorId` is
 * resolved against `users` when seeding; null means an unauthenticated visitor.
 */
export const activityLogs = [
  {
    id: 'acacacac-1111-1111-1111-111111111111',
    type: 'LOGIN_CODE_REQUESTED',
    actorId: null,
    target: null,
    context: { route: '/auth/request-login', method: 'POST', ip: '192.0.2.13', userAgent: 'Firefox/141.0' },
    metadata: { email: 'mira@student.kit.edu' },
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T09:03:00.000Z',
  },
  {
    id: 'acacacac-2222-2222-2222-222222222222',
    type: 'USER_LOGIN',
    actorId: '22222222-2222-2222-2222-222222222222',
    target: {
      type: 'SESSION',
      id: '22222222-2222-2222-2222-222222222222',
      label: 'MiraK session',
    },
    context: { route: '/auth/login', method: 'POST', ip: '192.0.2.13', userAgent: 'Firefox/141.0' },
    metadata: { method: 'EMAIL_OTP' },
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T09:05:00.000Z',
  },
  {
    id: 'acacacac-3333-3333-3333-333333333333',
    type: 'POST_CREATED',
    actorId: '22222222-2222-2222-2222-222222222222',
    target: {
      type: 'POST',
      id: 'p0570001-0000-0000-0000-000000000001',
      label: 'Study group for Algorithms II',
    },
    context: { route: '/posts', method: 'POST', ip: '192.0.2.13', userAgent: 'Firefox/141.0' },
    metadata: {},
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T09:22:00.000Z',
  },
  {
    id: 'acacacac-4444-4444-4444-444444444444',
    type: 'COMMENT_CREATED',
    actorId: '33333333-3333-3333-3333-333333333333',
    target: {
      type: 'COMMENT',
      id: 'c0770001-0000-0000-0000-000000000001',
      label: 'Re: Study group for Algorithms II',
    },
    context: { route: '/posts/1/comments', method: 'POST', ip: '192.0.2.14', userAgent: 'Chrome/141.0' },
    metadata: {},
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T10:41:00.000Z',
  },
  {
    id: 'acacacac-5555-5555-5555-555555555555',
    type: 'COMMENT_REPORTED',
    actorId: '44444444-4444-4444-4444-444444444444',
    target: {
      type: 'COMMENT_REPORT',
      id: '99999999-9999-9999-9999-999999999999',
      label: 'Report about JonasB in Software Engineering Practice',
    },
    context: { route: '/comments/report', method: 'POST', ip: '192.0.2.15', userAgent: 'Safari/19.0' },
    metadata: { reason: 'HARASSMENT' },
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T11:02:00.000Z',
  },
  {
    id: 'acacacac-6666-6666-6666-666666666666',
    type: 'USER_LOGIN_FAILED',
    actorId: null,
    target: null,
    context: { route: '/auth/login', method: 'POST', ip: '203.0.113.7', userAgent: 'curl/8.9.1' },
    metadata: { email: 'unknown@student.kit.edu', attempt: 3 },
    outcome: 'FAILURE',
    createdAt: '2026-07-14T12:18:00.000Z',
  },
  {
    id: 'acacacac-7777-7777-7777-777777777777',
    type: 'ADMIN_ACCESS_DENIED',
    actorId: '33333333-3333-3333-3333-333333333333',
    target: {
      type: 'ADMIN_ENDPOINT',
      id: 'users-list',
      label: 'GET /users',
    },
    context: { route: '/users', method: 'GET', ip: '192.0.2.14', userAgent: 'Chrome/141.0' },
    metadata: { requiredRole: 'ADMIN' },
    outcome: 'DENIED',
    createdAt: '2026-07-14T12:44:00.000Z',
  },
  {
    id: 'acacacac-8888-8888-8888-888888888888',
    type: 'BUG_REPORT_SUBMITTED',
    actorId: '44444444-4444-4444-4444-444444444444',
    target: {
      type: 'BUG_REPORT',
      id: '13131313-1313-1313-1313-131313131313',
      label: 'Profile modal closes on slow network',
    },
    context: { route: '/reports', method: 'POST', ip: '192.0.2.15', userAgent: 'Safari/19.0' },
    metadata: { severity: 'LOW' },
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T13:30:00.000Z',
  },
  {
    id: 'acacacac-9999-9999-9999-999999999999',
    type: 'PROFILE_UPDATED',
    actorId: '44444444-4444-4444-4444-444444444444',
    target: {
      type: 'USER',
      id: '44444444-4444-4444-4444-444444444444',
      label: 'LeylaS (leyla@student.kit.edu)',
    },
    context: { route: '/users/me', method: 'PATCH', ip: '192.0.2.15', userAgent: 'Safari/19.0' },
    metadata: { field: 'biography' },
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T14:58:00.000Z',
  },
  {
    id: 'acacacac-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    type: 'USER_LOGOUT',
    actorId: '22222222-2222-2222-2222-222222222222',
    target: {
      type: 'SESSION',
      id: '22222222-2222-2222-2222-222222222222',
      label: 'MiraK session',
    },
    context: { route: '/auth/logout', method: 'POST', ip: '192.0.2.13', userAgent: 'Firefox/141.0' },
    metadata: {},
    outcome: 'SUCCESS',
    createdAt: '2026-07-14T15:10:00.000Z',
  },
]

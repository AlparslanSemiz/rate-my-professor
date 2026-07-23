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

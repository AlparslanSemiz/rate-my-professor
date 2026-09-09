/** Every path the panel serves. The one place a route string is written. */
export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  users: '/users',
  comments: '/comments',
  catalog: '/catalog',
  feedback: '/feedback',
  auditLogs: '/audit-logs',
  activityLogs: '/activity-logs',
  help: '/help',
} as const

/** Any path in `routes`, so a map keyed by route cannot be indexed with a typo. */
export type Route = (typeof routes)[keyof typeof routes]

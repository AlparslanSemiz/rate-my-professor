import { activityLogHandlers, auditLogHandlers } from './logs'
import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { feedbackHandlers } from './feedback'
import { moderationHandlers } from './moderation'
import { systemHandlers } from './system'
import { usersHandlers } from './users'

/**
 * Every handler, in the order MSW resolves them: first match wins, so a per-test override
 * passed to `server.use` takes precedence over these.
 */
export const handlers = [...authHandlers, ...moderationHandlers, ...usersHandlers, ...auditLogHandlers, ...activityLogHandlers, ...systemHandlers, ...feedbackHandlers, ...catalogHandlers]

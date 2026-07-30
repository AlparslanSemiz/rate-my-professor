import { ACTIVITY_ACTIONS } from '../audit.mjs'
import { createLogHandler } from './logs.mjs'

/** What users did in the student app, plus every refused request. */
export const handleActivityLogs = createLogHandler({
  scopeActions: ACTIVITY_ACTIONS,
  arrayKey: 'activityLogs',
  adminActorsOnly: false,
})

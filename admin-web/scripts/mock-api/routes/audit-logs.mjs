import { ADMINISTRATIVE_ACTIONS } from '../audit.mjs'
import { createLogHandler } from './logs.mjs'

/** The administrative record: what admins did through the panel. */
export const handleAuditLogs = createLogHandler({
  scopeActions: ADMINISTRATIVE_ACTIONS,
  arrayKey: 'auditLogs',
  adminActorsOnly: true,
})

import type { HelpSection } from './types'
import { DASHBOARD_HELP } from './dashboard'
import { USERS_HELP } from './users'
import { COMMENTS_HELP } from './comments'
import { CATALOG_HELP } from './catalog'
import { FEEDBACK_HELP } from './feedback'
import { AUDIT_LOGS_HELP } from './auditLogs'
import { ACTIVITY_LOGS_HELP } from './activityLogs'

export type { HelpActionRow, HelpIcon, HelpSection, HelpValueGroup, HelpValueRow } from './types'

/**
 * Reference content for the in-app Help page, in the order the screens appear in the sidebar.
 *
 * A file per section rather than one blob: each one has to stay true as its screen changes,
 * and the person changing that screen should be able to find the paragraph that describes it.
 */
export const HELP_SECTIONS: HelpSection[] = [
  DASHBOARD_HELP,
  USERS_HELP,
  COMMENTS_HELP,
  CATALOG_HELP,
  FEEDBACK_HELP,
  AUDIT_LOGS_HELP,
  ACTIVITY_LOGS_HELP,
]

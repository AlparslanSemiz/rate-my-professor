import { IconHistory } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const AUDIT_LOGS_HELP: HelpSection = {
  id: 'audit-logs',
  title: 'Audit Logs',
  icon: IconHistory,
  summary:
    'Successful admin actions only; a rejected or failed attempt is never recorded here. Filter by search text, administrator, action, target or a date range, then open an event to see exactly which fields changed, before and after.',
}

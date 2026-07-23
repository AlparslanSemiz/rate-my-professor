import {
  IconBug,
  IconHistory,
  IconLayoutDashboard,
  IconMessageReport,
  IconUsers,
} from '@tabler/icons-react'
import { routes } from '../../constants/routes'

export const MAIN_NAV_ITEMS = [
  {
    label: 'Dashboard',
    sublabel: 'The big picture',
    path: routes.dashboard,
    icon: IconLayoutDashboard,
  },
  {
    label: 'Users',
    sublabel: 'People & profiles',
    path: routes.users,
    icon: IconUsers,
  },
  {
    label: 'Comments',
    sublabel: 'Flagged comments',
    path: routes.comments,
    icon: IconMessageReport,
  },
  {
    label: 'Bug Reports',
    sublabel: 'Bugs & crashes',
    path: routes.feedback,
    icon: IconBug,
  },
] as const

export const AUDIT_NAV_ITEM = {
  label: 'Audit Logs',
  sublabel: 'Admin activity',
  path: routes.auditLogs,
  icon: IconHistory,
} as const

export type NavigationItem = (typeof MAIN_NAV_ITEMS)[number] | typeof AUDIT_NAV_ITEM

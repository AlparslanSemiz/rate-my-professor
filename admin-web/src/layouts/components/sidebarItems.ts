import {
  IconActivity,
  IconBug,
  IconHeartRateMonitor,
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

/** Oversight views: what happened, who did it, and whether the backend is keeping up. */
export const OVERSIGHT_NAV_ITEMS = [
  {
    label: 'Audit Logs',
    sublabel: 'Admin activity',
    path: routes.auditLogs,
    icon: IconHistory,
  },
  {
    label: 'Activity Log',
    sublabel: 'Everyone else',
    path: routes.activityLogs,
    icon: IconActivity,
  },
  {
    label: 'System Status',
    sublabel: 'Backend health',
    path: routes.systemStatus,
    icon: IconHeartRateMonitor,
  },
] as const

export type NavigationItem =
  | (typeof MAIN_NAV_ITEMS)[number]
  | (typeof OVERSIGHT_NAV_ITEMS)[number]

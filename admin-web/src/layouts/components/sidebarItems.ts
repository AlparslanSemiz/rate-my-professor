import {
  IconActivity,
  IconBug,
  IconHelpCircle,
  IconHistory,
  IconLayoutDashboard,
  IconMessage,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react'
import { routes } from '@/constants/routes'

export const MAIN_NAV_ITEMS = [
  {
    label: 'Dashboard',
    sublabel: 'The big picture',
    path: routes.dashboard,
    icon: IconLayoutDashboard,
  },
  {
    label: 'Lectures & Professors',
    sublabel: 'The catalogue',
    path: routes.catalog,
    icon: IconSchool,
  },
  {
    label: 'Users',
    sublabel: 'People & profiles',
    path: routes.users,
    icon: IconUsers,
  },
  {
    label: 'Comments',
    sublabel: 'Posts, answers & reports',
    path: routes.comments,
    icon: IconMessage,
  },
  {
    label: 'Bug Reports',
    sublabel: 'Bugs & crashes',
    path: routes.feedback,
    icon: IconBug,
  },
] as const

/** Oversight views: what happened, who did it, and what the panel's controls mean. */
export const OVERSIGHT_NAV_ITEMS = [
  {
    label: 'Audit Logs',
    sublabel: 'Admin activity',
    path: routes.auditLogs,
    icon: IconHistory,
  },
  {
    label: 'Activity Logs',
    sublabel: 'Everyone else',
    path: routes.activityLogs,
    icon: IconActivity,
  },
  {
    label: 'Help',
    sublabel: 'What things mean',
    path: routes.help,
    icon: IconHelpCircle,
  },
] as const

export type NavigationItem =
  | (typeof MAIN_NAV_ITEMS)[number]
  | (typeof OVERSIGHT_NAV_ITEMS)[number]

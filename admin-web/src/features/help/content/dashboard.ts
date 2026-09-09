import { IconLayoutDashboard } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const DASHBOARD_HELP: HelpSection = {
  id: 'dashboard',
  title: 'Dashboard',
  icon: IconLayoutDashboard,
  summary: 'An overview, not a reporting system. Numbers refresh automatically every 15 seconds.',
  valueGroups: [
    {
      heading: 'What the cards mean',
      rows: [
        { value: 'Total users', color: 'blue', meaning: 'Every account the backend returned.' },
        {
          value: 'Not blocked',
          color: 'green',
          meaning:
            'Accounts whose status is Active. Not a count of who is online right now.',
        },
        { value: 'Admin accounts', color: 'yellow', meaning: 'Accounts whose role is Admin.' },
        {
          value: 'Open reports',
          color: 'orange',
          meaning: 'Bug reports whose status is Open — reported comments and answers are not counted here.',
        },
      ],
    },
  ],
}

import { IconActivity } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const ACTIVITY_LOGS_HELP: HelpSection = {
  id: 'activity-logs',
  title: 'Activity Logs',
  icon: IconActivity,
  summary:
    'What everyone else did: sign-ins, comments, answers, ratings and reports, plus the two kinds of request the backend refused. Nothing here can be undone: these entries record things that happened rather than fields that changed, so there is no undo control anywhere on this screen. Filter by search text, person, whether the actor was an admin or a student, action, target or a date range.',
  valueGroups: [
    {
      heading: 'The two refusals',
      rows: [
        {
          value: 'LOGIN_REFUSED',
          color: 'red',
          meaning:
            'A sign-in was turned down. The detail column says why: a wrong code, or an account that may not sign in. Only attempts against an account that exists are recorded.',
        },
        {
          value: 'ACCESS_REFUSED',
          color: 'red',
          meaning:
            'Somebody who was signed in asked for something they may not have. The detail column carries the method and path they asked for.',
        },
      ],
    },
  ],
}

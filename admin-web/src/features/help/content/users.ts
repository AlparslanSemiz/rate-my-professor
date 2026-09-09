import { IconUsers } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const USERS_HELP: HelpSection = {
  id: 'users',
  title: 'Users',
  icon: IconUsers,
  summary: 'Accounts and moderation. Search matches username or KIT email.',
  valueGroups: [
    {
      heading: 'Status',
      rows: [
        { value: 'Active', color: 'green', meaning: 'Normal account, nothing restricted.' },
        {
          value: 'Inactive',
          color: 'gray',
          meaning: 'Defined by the backend, but nothing in this panel sets or checks it.',
        },
        {
          value: 'Blocked',
          color: 'red',
          meaning: 'Access blocked by moderation. Set with the Block / Unblock action.',
        },
        {
          value: 'Deleted',
          color: 'dark',
          meaning: 'Not a status you can set — deleting an account removes it outright, and that cannot be undone.',
        },
      ],
    },
    {
      heading: 'Role',
      rows: [
        { value: 'Student', color: 'gray', meaning: 'Regular community account.' },
        {
          value: 'Admin',
          color: 'blue',
          meaning:
            'Full panel access. Non-elevated admins cannot warn, block, delete or change the status of another admin account. Your own account cannot have its status, role or credibility score changed here.',
        },
      ],
    },
  ],
  actions: [
    {
      action: 'Edit',
      result:
        'Changes username, biography, and — for a non-admin, non-self account — status, role or credibility score. KIT email can never be changed here: it is the sign-in identity.',
    },
    { action: 'Warn', result: 'Records a warning with a reason. Shows up in that user’s Warning History.' },
    { action: 'Block / Unblock', result: 'Sets status to Blocked, or back to Active.' },
    { action: 'Delete account', result: 'Permanently removes the account. Cannot be undone.' },
  ],
}

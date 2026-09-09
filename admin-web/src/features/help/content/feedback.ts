import { IconBug } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const FEEDBACK_HELP: HelpSection = {
  id: 'feedback',
  title: 'Bug Reports',
  icon: IconBug,
  summary: 'Technical problems submitted by users, with device info attached where available.',
  valueGroups: [
    {
      heading: 'Status',
      rows: [
        { value: 'Open', color: 'red', meaning: 'Waiting for review.' },
        { value: 'Reviewed', color: 'blue', meaning: 'Looked at, no final decision yet.' },
        { value: 'Dismissed', color: 'gray', meaning: 'Closed with no action.' },
        { value: 'Action Taken', color: 'green', meaning: 'Closed, and something was done about it.' },
      ],
    },
    {
      heading: 'Severity',
      rows: [
        { value: 'Low', color: 'gray', meaning: 'Minor, cosmetic.' },
        { value: 'Medium', color: 'yellow', meaning: 'Noticeable but not blocking.' },
        { value: 'High', color: 'orange', meaning: 'Blocks a real workflow for some users.' },
        { value: 'Critical', color: 'red', meaning: 'Severe — data loss, crash, or similar.' },
      ],
    },
  ],
  actions: [
    { action: 'Change Status / Severity', result: 'Saved immediately from the report modal.' },
    { action: 'Delete report', result: 'Permanently removes it. Cannot be undone.' },
  ],
}

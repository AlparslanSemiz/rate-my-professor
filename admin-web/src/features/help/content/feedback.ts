import { IconBug } from '@tabler/icons-react'
import type { HelpSection } from './types'
import { reportStatusColor, severityColor } from '@/constants/colors'

export const FEEDBACK_HELP: HelpSection = {
  id: 'feedback',
  title: 'Bug Reports',
  icon: IconBug,
  summary: 'Technical problems submitted by users, with device info attached where available.',
  valueGroups: [
    {
      heading: 'Status',
      rows: [
        { value: 'Open', color: reportStatusColor.OPEN, meaning: 'Waiting for review.' },
        { value: 'Reviewed', color: reportStatusColor.REVIEWED, meaning: 'Looked at, no final decision yet.' },
        { value: 'Dismissed', color: reportStatusColor.DISMISSED, meaning: 'Closed with no action.' },
        { value: 'Action Taken', color: reportStatusColor.ACTION_TAKEN, meaning: 'Closed, and something was done about it.' },
      ],
    },
    {
      heading: 'Severity',
      rows: [
        { value: 'Low', color: severityColor.LOW, meaning: 'Minor, cosmetic.' },
        { value: 'Medium', color: severityColor.MEDIUM, meaning: 'Noticeable but not blocking.' },
        { value: 'High', color: severityColor.HIGH, meaning: 'Blocks a real workflow for some users.' },
        { value: 'Critical', color: severityColor.CRITICAL, meaning: 'Severe: data loss, crash, or similar.' },
      ],
    },
  ],
  actions: [
    { action: 'Change Status / Severity', result: 'Saved immediately from the report modal.' },
    { action: 'Delete report', result: 'Permanently removes it. Cannot be undone.' },
  ],
}

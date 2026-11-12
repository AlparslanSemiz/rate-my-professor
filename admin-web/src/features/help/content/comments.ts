import { IconMessage } from '@tabler/icons-react'
import type { HelpSection } from './types'
import { contentStatusColor, reportStatusColor } from '@/constants/colors'

export const COMMENTS_HELP: HelpSection = {
  id: 'comments',
  title: 'Comments',
  icon: IconMessage,
  summary:
    'Every comment, with its answers nested underneath. Expand the ▸ next to a comment to see the replies posted under it. An answer is edited, hidden or deleted exactly like a comment; only the underlying request differs.',
  valueGroups: [
    {
      heading: 'Visibility',
      rows: [
        { value: 'Visible', color: contentStatusColor.VISIBLE, meaning: 'Shown in the student app.' },
        {
          value: 'Hidden',
          color: contentStatusColor.HIDDEN,
          meaning: 'Filtered out of the student app but kept in the database. Reversible.',
        },
        {
          value: 'Deleted',
          color: contentStatusColor.DELETED,
          meaning: 'Not a visibility you can set: deleting is permanent, and deleting a comment takes every answer under it with it.',
        },
      ],
    },
    {
      heading: 'Report status',
      rows: [
        { value: 'Open', color: reportStatusColor.OPEN, meaning: 'Waiting for review.' },
        { value: 'Reviewed', color: reportStatusColor.REVIEWED, meaning: 'Looked at, no final decision recorded yet.' },
        { value: 'Dismissed', color: reportStatusColor.DISMISSED, meaning: 'Closed with no action against the content.' },
        {
          value: 'Action Taken',
          color: reportStatusColor.ACTION_TAKEN,
          meaning: 'Closed and the content was hidden. Moving a report away from this status makes the content visible again.',
        },
      ],
    },
  ],
  actions: [
    { action: 'Edit content by …', result: 'Changes the text and/or the visibility of a comment or answer.' },
    { action: 'Delete content by …', result: 'Permanently removes it. For a comment, its answers go too.' },
    {
      action: 'Change a report’s status',
      result: 'Action Taken hides the reported content; any other status leaves or restores it.',
    },
    { action: 'Withdraw report', result: 'Removes the report only; the content is left exactly as it is.' },
  ],
}

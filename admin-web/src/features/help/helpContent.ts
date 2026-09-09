import type { ComponentType } from 'react'
import {
  IconBug,
  IconHistory,
  IconLayoutDashboard,
  IconMessage,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react'

type HelpIcon = ComponentType<{ size?: number; color?: string }>

export interface HelpValueRow {
  value: string
  color: string
  meaning: string
}

export interface HelpValueGroup {
  heading: string
  rows: HelpValueRow[]
}

export interface HelpActionRow {
  action: string
  result: string
}

export interface HelpSection {
  id: string
  title: string
  icon: HelpIcon
  summary: string
  valueGroups?: HelpValueGroup[]
  actions?: HelpActionRow[]
  notes?: string[]
}

/**
 * Reference content for the in-app Help page. Kept close to what the panel actually does today
 * rather than the wider project wiki, which documents some pages (and a couple of dashboard
 * metrics) this build does not show.
 */
export const HELP_SECTIONS: HelpSection[] = [
  {
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
  },
  {
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
  },
  {
    id: 'comments',
    title: 'Comments',
    icon: IconMessage,
    summary:
      'Every comment, with its answers nested underneath — expand the ▸ next to a comment to see the replies posted under it. An answer is edited, hidden or deleted exactly like a comment; only the underlying request differs.',
    valueGroups: [
      {
        heading: 'Visibility',
        rows: [
          { value: 'Visible', color: 'green', meaning: 'Shown in the student app.' },
          {
            value: 'Hidden',
            color: 'orange',
            meaning: 'Filtered out of the student app but kept in the database. Reversible.',
          },
          {
            value: 'Deleted',
            color: 'dark',
            meaning: 'Not a visibility you can set — deleting is permanent, and deleting a comment takes every answer under it with it.',
          },
        ],
      },
      {
        heading: 'Report status',
        rows: [
          { value: 'Open', color: 'red', meaning: 'Waiting for review.' },
          { value: 'Reviewed', color: 'blue', meaning: 'Looked at, no final decision recorded yet.' },
          { value: 'Dismissed', color: 'gray', meaning: 'Closed with no action against the content.' },
          {
            value: 'Action Taken',
            color: 'green',
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
      { action: 'Withdraw report', result: 'Removes the report only — the content is left exactly as it is.' },
    ],
  },
  {
    id: 'catalog',
    title: 'Lectures & Professors',
    icon: IconSchool,
    summary: 'The lectures students rate and the professors who teach them.',
    actions: [
      {
        action: 'Edit lecture',
        result: 'Changes its name/details and which professors are assigned to it.',
      },
      { action: 'Edit professor', result: 'Changes their details and which lectures they teach.' },
      {
        action: 'Delete lecture',
        result: 'Removes the lecture and every comment, answer and rating under it. Cannot be undone.',
      },
      {
        action: 'Delete professor',
        result: 'Removes the professor only — their lectures stay, just the assignment is dropped.',
      },
    ],
  },
  {
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
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    icon: IconHistory,
    summary:
      'Successful admin actions only — a rejected or failed attempt is never recorded here. Filter by search text, administrator, action, target or a date range, then open an event to see exactly which fields changed, before and after.',
  },
]

import type { ContentStatus, ReportReason, ReportStatus, Severity } from '../domain/moderation'
import type { UserRole, UserStatus } from '../domain/user'
import { routes } from './routes'

/**
 * The colour a section is drawn in, keyed by its route. The dashboard's module cards, its
 * stat cards and the sidebar all read it from here: they used to hold their own copies, so
 * the same section could be one colour on the dashboard and another in the navigation.
 */
export const moduleAccent: Record<string, string> = {
  [routes.dashboard]: '#22c55e',
  [routes.catalog]: '#14b8a6',
  [routes.users]: '#3b82f6',
  [routes.comments]: '#8b5cf6',
  [routes.feedback]: '#f97316',
}

/** For the oversight views, which are not modules and have no colour of their own. */
export const DEFAULT_ACCENT = '#22c55e'

export const roleColor: Record<UserRole, string> = {
  ADMIN: 'blue',
  STUDENT: 'gray',
}

export const roleAccent: Record<UserRole, string> = {
  ADMIN: '#3b82f6',
  STUDENT: '#6b7280',
}

export const userStatusColor: Record<UserStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  DELETED: 'dark',
}

export const severityColor: Record<Severity, string> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export const severityAccent: Record<Severity, string> = {
  LOW: '#6b7280',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export const reportStatusColor: Record<ReportStatus, string> = {
  OPEN: 'red',
  REVIEWED: 'blue',
  DISMISSED: 'gray',
  ACTION_TAKEN: 'green',
}

export const contentStatusColor: Record<ContentStatus, string> = {
  VISIBLE: 'green',
  HIDDEN: 'orange',
  DELETED: 'dark',
}

export const reportReasonColor: Record<ReportReason, string> = {
  SPAM: 'yellow',
  INSULT: 'orange',
  HARASSMENT: 'red',
  HATE_SPEECH: 'red',
  PERSONAL_INFORMATION: 'grape',
  OFF_TOPIC: 'gray',
  INAPPROPRIATE_CONTENT: 'orange',
  OTHER: 'gray',
}

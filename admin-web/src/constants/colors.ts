import type { ReportReason, ReportStatus, Severity } from '../domain/moderation'
import type { UserRole, UserStatus } from '../domain/user'

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

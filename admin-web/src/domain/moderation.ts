import { enumGuard } from './enumGuard'

export const REPORT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_REASONS = [
  'SPAM',
  'INSULT',
  'HARASSMENT',
  'HATE_SPEECH',
  'PERSONAL_INFORMATION',
  'OFF_TOPIC',
  'INAPPROPRIATE_CONTENT',
  'OTHER',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

/**
 * Visibility of a comment or an answer. `DELETED` is never set from the panel — removing
 * content is `DELETE /comments/{id}`, which is a real delete — but it is listed because the
 * backend can return it.
 */
export const CONTENT_STATUSES = ['VISIBLE', 'HIDDEN', 'DELETED'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

/** The two values an admin can switch content between. */
export const EDITABLE_CONTENT_STATUSES = ['VISIBLE', 'HIDDEN'] as const
export type EditableContentStatus = (typeof EDITABLE_CONTENT_STATUSES)[number]

export const isReportStatus = enumGuard(REPORT_STATUSES)

export const isReportReason = enumGuard(REPORT_REASONS)

export const isSeverity = enumGuard(SEVERITIES)

export const isContentStatus = enumGuard(CONTENT_STATUSES)

export const isEditableContentStatus = enumGuard(EDITABLE_CONTENT_STATUSES)

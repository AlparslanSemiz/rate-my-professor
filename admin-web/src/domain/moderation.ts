export const REPORT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
const reportStatusValues: ReadonlySet<string> = new Set(REPORT_STATUSES)

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
const reportReasonValues: ReadonlySet<string> = new Set(REPORT_REASONS)

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]
const severityValues: ReadonlySet<string> = new Set(SEVERITIES)

/**
 * Visibility of a comment or an answer. `DELETED` is never set from the panel — removing
 * content is `DELETE /comments/{id}`, which is a real delete — but it is listed because the
 * backend can return it.
 */
export const CONTENT_STATUSES = ['VISIBLE', 'HIDDEN', 'DELETED'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]
const contentStatusValues: ReadonlySet<string> = new Set(CONTENT_STATUSES)

/** The two values an admin can switch content between. */
export const EDITABLE_CONTENT_STATUSES = ['VISIBLE', 'HIDDEN'] as const
export type EditableContentStatus = (typeof EDITABLE_CONTENT_STATUSES)[number]

export function isReportStatus(value: string | null): value is ReportStatus {
  return value !== null && reportStatusValues.has(value)
}

export function isReportReason(value: string | null): value is ReportReason {
  return value !== null && reportReasonValues.has(value)
}

export function isSeverity(value: string | null): value is Severity {
  return value !== null && severityValues.has(value)
}

export function isContentStatus(value: string | null): value is ContentStatus {
  return value !== null && contentStatusValues.has(value)
}

export function isEditableContentStatus(value: string | null): value is EditableContentStatus {
  return value === 'VISIBLE' || value === 'HIDDEN'
}

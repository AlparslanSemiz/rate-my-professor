import { enumGuard } from './enumGuard'

/**
 * How far a report has been worked. `ACTION_TAKEN` is the only one with a side effect: it
 * hides the content it is about, and every other status restores it.
 */
export const REPORT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'] as const
/** One of {@link REPORT_STATUSES}. */
export type ReportStatus = (typeof REPORT_STATUSES)[number]

/** Why a student reported something. The backend's vocabulary, rendered as the filter list. */
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
/** One of {@link REPORT_REASONS}. */
export type ReportReason = (typeof REPORT_REASONS)[number]

/** How bad a bug report is, as the reporting student judged it. */
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
/** One of {@link SEVERITIES}. */
export type Severity = (typeof SEVERITIES)[number]

/**
 * Visibility of a comment or an answer. `DELETED` is never set from the panel — removing
 * content is `DELETE /comments/{id}`, which is a real delete — but it is listed because the
 * backend can return it.
 */
export const CONTENT_STATUSES = ['VISIBLE', 'HIDDEN', 'DELETED'] as const
/** One of {@link CONTENT_STATUSES}. */
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

/** The two values an admin can switch content between. */
export const EDITABLE_CONTENT_STATUSES = ['VISIBLE', 'HIDDEN'] as const
/** One of {@link EDITABLE_CONTENT_STATUSES}. */
export type EditableContentStatus = (typeof EDITABLE_CONTENT_STATUSES)[number]

/** @returns whether the value is a status this panel knows. */
export const isReportStatus = enumGuard(REPORT_STATUSES)

/** @returns whether the value is a reason this panel knows. */
export const isReportReason = enumGuard(REPORT_REASONS)

/** @returns whether the value is a severity this panel knows. */
export const isSeverity = enumGuard(SEVERITIES)

/** @returns whether the value is a content status this panel knows. */
export const isContentStatus = enumGuard(CONTENT_STATUSES)

/** @returns whether the value is a status an admin may switch content to. */
export const isEditableContentStatus = enumGuard(EDITABLE_CONTENT_STATUSES)

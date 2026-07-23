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

export function isReportStatus(value: string | null): value is ReportStatus {
  return value !== null && reportStatusValues.has(value)
}

export function isReportReason(value: string | null): value is ReportReason {
  return value !== null && reportReasonValues.has(value)
}

export function isSeverity(value: string | null): value is Severity {
  return value !== null && severityValues.has(value)
}

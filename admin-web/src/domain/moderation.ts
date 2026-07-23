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

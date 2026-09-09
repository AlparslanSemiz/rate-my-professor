import {
  CONTENT_STATUSES,
  REPORT_REASONS,
  REPORT_STATUSES,
  isContentStatus,
  isReportReason,
  isReportStatus,
  type ContentStatus,
  type ReportReason,
  type ReportStatus,
} from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'

export const ALL_FILTERS = 'All'

export type StatusFilter = typeof ALL_FILTERS | ReportStatus
export type ReasonFilter = typeof ALL_FILTERS | ReportReason
export type ContentStatusFilter = typeof ALL_FILTERS | ContentStatus

export const reportStatusSelectOptions = REPORT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

const reasonSelectOptions = REPORT_REASONS.map((reason) => ({
  value: reason,
  label: enumLabel(reason),
}))

const allOption = { value: ALL_FILTERS, label: ALL_FILTERS }

export const reportStatusFilterOptions = [allOption, ...reportStatusSelectOptions]
export const reasonFilterOptions = [allOption, ...reasonSelectOptions]
export const contentStatusFilterOptions = [
  allOption,
  ...CONTENT_STATUSES.map((status) => ({ value: status, label: enumLabel(status) })),
]

export function toStatusFilter(value: string | null): StatusFilter {
  return value === ALL_FILTERS || isReportStatus(value) ? value : ALL_FILTERS
}

export function toReasonFilter(value: string | null): ReasonFilter {
  return value === ALL_FILTERS || isReportReason(value) ? value : ALL_FILTERS
}

export function toContentStatusFilter(value: string | null): ContentStatusFilter {
  return value === ALL_FILTERS || isContentStatus(value) ? value : ALL_FILTERS
}

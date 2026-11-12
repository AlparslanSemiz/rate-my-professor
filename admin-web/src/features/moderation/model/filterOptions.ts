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
} from '@/domain/moderation'
import { enumLabel } from '@/utils/enumLabel'

/**
 * The "no filter" option. A value rather than `null` because a Mantine `Select` shows its
 * placeholder for an empty value, and "All" has to read as a deliberate choice in the box.
 */
export const ALL_FILTERS = 'All'

/** A report status, or no status filter at all. */
export type StatusFilter = typeof ALL_FILTERS | ReportStatus
/** A report reason, or no reason filter at all. */
export type ReasonFilter = typeof ALL_FILTERS | ReportReason
/** A content status, or no status filter at all. */
export type ContentStatusFilter = typeof ALL_FILTERS | ContentStatus

/** The statuses a report can be moved to. No "All" — this sets a value rather than filters. */
export const reportStatusSelectOptions = REPORT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

const reasonSelectOptions = REPORT_REASONS.map((reason) => ({
  value: reason,
  label: enumLabel(reason),
}))

const allOption = { value: ALL_FILTERS, label: ALL_FILTERS }

/** Status options for the reports filter, "All" first. */
export const reportStatusFilterOptions = [allOption, ...reportStatusSelectOptions]
/** Reason options for the reports filter, "All" first. */
export const reasonFilterOptions = [allOption, ...reasonSelectOptions]
/** Status options for the content filter, "All" first. */
export const contentStatusFilterOptions = [
  allOption,
  ...CONTENT_STATUSES.map((status) => ({ value: status, label: enumLabel(status) })),
]

/**
 * @param value whatever the dropdown reported, including `null` when it was cleared
 * @returns the value if it is a status this panel knows, otherwise no filter
 */
export function toStatusFilter(value: string | null): StatusFilter {
  return value === ALL_FILTERS || isReportStatus(value) ? value : ALL_FILTERS
}

/**
 * @param value whatever the dropdown reported
 * @returns the value if it is a reason this panel knows, otherwise no filter
 */
export function toReasonFilter(value: string | null): ReasonFilter {
  return value === ALL_FILTERS || isReportReason(value) ? value : ALL_FILTERS
}

/**
 * @param value whatever the dropdown reported
 * @returns the value if it is a content status this panel knows, otherwise no filter
 */
export function toContentStatusFilter(value: string | null): ContentStatusFilter {
  return value === ALL_FILTERS || isContentStatus(value) ? value : ALL_FILTERS
}

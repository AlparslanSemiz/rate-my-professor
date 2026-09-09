import { IconAlertCircle, IconCircleCheck, IconEye, IconX, type Icon } from '@tabler/icons-react'
import type { BugReport } from '@/api/feedback'
import type { ReportStatus } from '@/domain/moderation'

/**
 * A report is finished once it has been acted on or dismissed. Everything else is still work:
 * `OPEN` has not been looked at, `REVIEWED` has been looked at and not yet resolved.
 */
export function isClosedReport(status: ReportStatus): boolean {
  return status === 'ACTION_TAKEN' || status === 'DISMISSED'
}

/** The reports still to be worked, newest first. */
export function openReports(reports: BugReport[]): BugReport[] {
  return reports.filter((report) => !isClosedReport(report.status))
}

/** The reports that are done with. */
export function closedReports(reports: BugReport[]): BugReport[] {
  return reports.filter((report) => isClosedReport(report.status))
}

/**
 * An icon per status, so the badge is recognisable before the label is read. The four used to
 * be indistinguishable light badges sitting next to an equally light severity badge.
 */
export const reportStatusIcon: Record<ReportStatus, Icon> = {
  OPEN: IconAlertCircle,
  REVIEWED: IconEye,
  DISMISSED: IconX,
  ACTION_TAKEN: IconCircleCheck,
}

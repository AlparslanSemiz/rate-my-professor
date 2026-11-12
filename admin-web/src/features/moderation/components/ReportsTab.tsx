import type { ReportStatus } from '@/domain/moderation'
import type { useModerationReports } from '../hooks/useModerationReports'
import type { ModeratedItem, ReportItem } from '../model'
import ReportFilters from './ReportFilters'
import ReportsTable from './ReportsTable'

interface ReportsTabProps {
  reports: ReturnType<typeof useModerationReports>
  noun: string
  updating: boolean
  contentFor: (report: ReportItem) => ModeratedItem | null
  onOpenProfile: (userId: string) => void
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
  onEditContent: (item: ModeratedItem) => void
  onDeleteContent: (item: ModeratedItem) => void
  onWithdraw: (report: ReportItem) => void
}

export default function ReportsTab({
  reports,
  noun,
  updating,
  contentFor,
  onOpenProfile,
  onStatusChange,
  onEditContent,
  onDeleteContent,
  onWithdraw,
}: ReportsTabProps) {
  return (
    <>
      <ReportFilters
        search={reports.search}
        status={reports.statusFilter}
        reason={reports.reasonFilter}
        searchLabel={`Search reported ${noun}s`}
        onSearchChange={reports.setSearch}
        onStatusChange={reports.setStatusFilter}
        onReasonChange={reports.setReasonFilter}
      />
      <ReportsTable
        reports={reports.filtered}
        updating={updating}
        contentFor={contentFor}
        onOpenProfile={onOpenProfile}
        onStatusChange={onStatusChange}
        onEditContent={onEditContent}
        onDeleteContent={onDeleteContent}
        onWithdraw={onWithdraw}
      />
    </>
  )
}

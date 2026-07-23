import { useMemo, useState } from 'react'
import {
  commentsService,
  type CommentReportStatus,
  type ReportedComment,
} from '../../api/CommentsService'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useSearch } from '../../hooks/useSearch'
import { useSelectedId } from '../../hooks/useSelectedId'
import { updateById } from '../../utils/collection'
import { getErrorMessage } from '../../utils/getErrorMessage'
import UserProfileModal from '../users/components/UserProfileModal'
import {
  ALL_FILTERS,
  matchesCommentFilters,
  matchesCommentQuery,
  type ReasonFilter,
  type StatusFilter,
} from './commentFilters'
import CommentFilters from './components/CommentFilters'
import CommentsStats from './components/CommentsStats'
import CommentsTable from './components/CommentsTable'

const LOAD_ERROR_MESSAGE = 'Failed to load reported comments'
const EMPTY_REPORTS: ReportedComment[] = []

function loadReportedComments() {
  return commentsService.getReported()
}

export default function CommentsPage() {
  const {
    data: reports,
    setData: setReports,
    loading,
    error,
    retry,
  } = useAsyncData(loadReportedComments, EMPTY_REPORTS, LOAD_ERROR_MESSAGE)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(ALL_FILTERS)
  const [filterReason, setFilterReason] = useState<ReasonFilter>(ALL_FILTERS)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState('')
  const profile = useSelectedId()
  const { search, setSearch, filtered: searchFiltered } = useSearch(reports, matchesCommentQuery)

  const filteredReports = useMemo(
    () =>
      searchFiltered.filter((report) =>
        matchesCommentFilters(report, filterStatus, filterReason),
      ),
    [searchFiltered, filterStatus, filterReason],
  )

  async function handleStatusChange(id: string, status: CommentReportStatus) {
    setStatusUpdating(true)
    setStatusError('')

    try {
      await commentsService.updateStatus(id, status)
      setReports((current) => updateById(current, id, (report) => ({ ...report, status })))
    } catch (updateFailure: unknown) {
      setStatusError(
        getErrorMessage(updateFailure, 'Failed to update the report. The change was not saved.'),
      )
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) return <PageLoader />
  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Reported Comments"
        description="Comments your community flagged, waiting for a look. Tap a name to open their profile."
      />
      <CommentsStats reports={reports} />
      <CommentFilters
        search={search}
        status={filterStatus}
        reason={filterReason}
        onSearchChange={setSearch}
        onStatusChange={setFilterStatus}
        onReasonChange={setFilterReason}
      />
      <ErrorAlert message={statusError} />
      <CommentsTable
        reports={filteredReports}
        updating={statusUpdating}
        onOpenProfile={profile.open}
        onStatusChange={handleStatusChange}
      />
      <UserProfileModal
        userId={profile.selectedId}
        opened={profile.opened}
        onClose={profile.close}
      />
    </>
  )
}

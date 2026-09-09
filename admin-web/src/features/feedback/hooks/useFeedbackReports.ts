import { useQuery } from '@tanstack/react-query'
import { feedbackService, type BugReport } from '@/api/feedback'
import { systemStatusService } from '@/api/system'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { feedbackKeys } from './feedbackKeys'

const LOAD_ERROR_MESSAGE = 'Failed to load bug reports'
const EMPTY_REPORTS: BugReport[] = []

/**
 * Whether the backend holds GitLab credentials. A failure reads as "off" rather than as an
 * error: the endpoint answers `503` without them, and offering a button that cannot work is
 * worse than not offering one. Swallowed inside the `queryFn` so it cannot fail the screen.
 */
async function fetchGitlabEnabled(): Promise<boolean> {
  try {
    return (await systemStatusService.getStatus()).gitlabEnabled
  } catch {
    return false
  }
}

export function useFeedbackReports() {
  const reports = useQuery({
    queryKey: feedbackKeys.reports(),
    queryFn: () => feedbackService.getReports(),
  })
  const gitlab = useQuery({ queryKey: feedbackKeys.gitlab(), queryFn: fetchGitlabEnabled })

  // A first load that produced nothing takes over the page. A failure once the queue is on
  // screen must not: every write re-reads, and losing the list to report a failed re-read
  // would tell the operator their accepted change had gone wrong. That failure is reported by
  // `useFeedbackReportActions` as a stale-view notice instead.
  const hasLoaded = reports.data !== undefined

  return {
    reports: reports.data ?? EMPTY_REPORTS,
    gitlabEnabled: gitlab.data ?? false,
    loading: reports.isPending,
    error: hasLoaded || !reports.error ? '' : getErrorMessage(reports.error, LOAD_ERROR_MESSAGE),
    retry: () => {
      void reports.refetch()
    },
  }
}

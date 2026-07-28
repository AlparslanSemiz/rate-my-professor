import { useState } from 'react'
import type { ActivityLog } from '../../api/ActivityLogsService'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import ActivityLogDetails from './components/ActivityLogDetails'
import ActivityLogFilters from './components/ActivityLogFilters'
import ActivityLogsTable from './components/ActivityLogsTable'
import { useActivityLogs } from './hooks/useActivityLogs'

export default function ActivityLogsPage() {
  const activityLogs = useActivityLogs()
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null)

  if (activityLogs.loading && activityLogs.items.length === 0 && !activityLogs.tableError) {
    return <PageLoader />
  }

  if (activityLogs.initialError) {
    return (
      <>
        <ActivityPageHeader />
        <LoadError
          message={activityLogs.initialError}
          onRetry={() => void activityLogs.retryInitialLoad()}
        />
      </>
    )
  }

  return (
    <>
      <ActivityPageHeader />
      <ActivityLogFilters
        draft={activityLogs.draft}
        meta={activityLogs.meta}
        loading={activityLogs.loading}
        onDraftChange={activityLogs.setDraft}
        onApply={activityLogs.applyFilters}
        onClear={activityLogs.clearFilters}
      />
      <ErrorAlert message={activityLogs.tableError} />
      <ActivityLogsTable
        activities={activityLogs.items}
        nextCursor={activityLogs.nextCursor}
        loading={activityLogs.loading}
        loadingMore={activityLogs.loadingMore}
        onOpen={setSelectedActivity}
        onLoadMore={activityLogs.loadMore}
      />
      <ActivityLogDetails
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </>
  )
}

function ActivityPageHeader() {
  return (
    <PageHeader
      title="Activity Log"
      description="Everything people do in the app: who signed in, what they posted or reported, and what was refused."
    />
  )
}

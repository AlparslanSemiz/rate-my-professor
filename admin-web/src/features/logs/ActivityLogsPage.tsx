import { useState } from 'react'
import type { AuditEntry } from '@/api/logs'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import LogDetails from './components/details/LogDetails'
import LogFilters from './components/LogFilters'
import LogsTable from './components/LogsTable'
import { useLogPage } from './hooks/useLogPage'
import { ACTIVITY_SCREEN } from './logScreen'

/** What the details modal says when the backend recorded nothing beyond the action itself. */
const NO_METADATA = 'Nothing beyond the action itself.'

/**
 * What students did in the app, and what was refused.
 *
 * Nothing here is reversible and nothing here offers to be: the entries are typed `AuditEntry`,
 * which carries no `revertible`, and no undo control is imported into this file. That is the
 * whole difference from `AuditLogsPage`, and it is structural rather than conditional — see
 * ADR 0016.
 */
export default function ActivityLogsPage() {
  const activityLogs = useLogPage(ACTIVITY_SCREEN)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

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
      <LogFilters
        screen={ACTIVITY_SCREEN}
        draft={activityLogs.draft}
        meta={activityLogs.meta}
        loading={activityLogs.loading}
        onDraftChange={activityLogs.setDraft}
        onApply={activityLogs.applyFilters}
        onClear={activityLogs.clearFilters}
      />
      <ErrorAlert message={activityLogs.tableError} />
      <LogsTable
        screen={ACTIVITY_SCREEN}
        entries={activityLogs.items}
        hasMore={activityLogs.hasMore}
        loading={activityLogs.loading}
        loadingMore={activityLogs.loadingMore}
        onOpen={setSelectedEntry}
        onLoadMore={activityLogs.loadMore}
      />
      <LogDetails
        screen={ACTIVITY_SCREEN}
        entry={selectedEntry}
        title="Activity Details"
        metadataEmptyText={NO_METADATA}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  )
}

function ActivityPageHeader() {
  return <PageHeader title={ACTIVITY_SCREEN.title} description={ACTIVITY_SCREEN.description} />
}

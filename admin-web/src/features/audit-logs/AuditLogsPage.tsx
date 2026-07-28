import { useState } from 'react'
import type { AuditLog } from '../../api/AuditLogsService'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import AuditLogDetails from './components/AuditLogDetails'
import AuditLogFilters from './components/AuditLogFilters'
import AuditLogsTable from './components/AuditLogsTable'
import { useAuditLogs } from './hooks/useAuditLogs'

export default function AuditLogsPage() {
  const auditLogs = useAuditLogs()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  if (auditLogs.loading && auditLogs.items.length === 0 && !auditLogs.tableError) {
    return <PageLoader />
  }

  if (auditLogs.initialError) {
    return (
      <>
        <AuditPageHeader />
        <LoadError
          message={auditLogs.initialError}
          onRetry={() => void auditLogs.retryInitialLoad()}
        />
      </>
    )
  }

  return (
    <>
      <AuditPageHeader />
      <AuditLogFilters
        draft={auditLogs.draft}
        meta={auditLogs.meta}
        loading={auditLogs.loading}
        onDraftChange={auditLogs.setDraft}
        onApply={auditLogs.applyFilters}
        onClear={auditLogs.clearFilters}
      />
      <ErrorAlert message={auditLogs.tableError} />
      <AuditLogsTable
        logs={auditLogs.items}
        nextCursor={auditLogs.nextCursor}
        loading={auditLogs.loading}
        loadingMore={auditLogs.loadingMore}
        onOpen={setSelectedLog}
        onLoadMore={auditLogs.loadMore}
      />
      <AuditLogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  )
}

function AuditPageHeader() {
  return (
    <PageHeader
      title="Audit Logs"
      description="A trace of successful admin actions, showing who changed what and when."
    />
  )
}

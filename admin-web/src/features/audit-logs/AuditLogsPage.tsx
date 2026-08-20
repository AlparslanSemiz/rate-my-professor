import { useState } from 'react'
import { auditLogsService, type AuditLog } from '../../api/AuditLogsService'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { getRevertErrorMessage } from './auditLogModel'
import AuditLogDetails from './components/AuditLogDetails'
import AuditLogFilters from './components/AuditLogFilters'
import AuditLogsTable from './components/AuditLogsTable'
import { useAuditLogs } from './hooks/useAuditLogs'
import { enumLabel } from '../../utils/enumLabel'

export default function AuditLogsPage() {
  const auditLogs = useAuditLogs()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [confirmingRevert, setConfirmingRevert] = useState<AuditLog | null>(null)
  const [reverting, setReverting] = useState(false)
  const [revertError, setRevertError] = useState('')

  function openLog(log: AuditLog) {
    setSelectedLog(log)
    setRevertError('')
  }

  /**
   * The revert answers `{success, message}` and nothing else, so the log is re-read rather
   * than patched: the reversal's own entry is only there, and this entry only starts
   * reporting `revertedByAuditId` once the backend says so.
   */
  async function revert(log: AuditLog) {
    setConfirmingRevert(null)
    setReverting(true)
    setRevertError('')
    try {
      await auditLogsService.revert(log.id)
      setSelectedLog(null)
      await auditLogs.reload()
    } catch (error: unknown) {
      setRevertError(getRevertErrorMessage(error))
    } finally {
      setReverting(false)
    }
  }

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
        onOpen={openLog}
        onLoadMore={auditLogs.loadMore}
      />
      <AuditLogDetails
        log={selectedLog}
        reverting={reverting}
        revertError={revertError}
        onRevert={setConfirmingRevert}
        onClose={() => setSelectedLog(null)}
      />
      {confirmingRevert && (
        <ConfirmModal
          opened
          title="Undo this change"
          description={`Put the fields this ${enumLabel(confirmingRevert.action)} entry changed back to what they were? The undo is recorded as its own audit entry.`}
          confirmLabel="Undo the change"
          confirmColor="orange"
          onConfirm={() => revert(confirmingRevert)}
          onClose={() => setConfirmingRevert(null)}
        />
      )}
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

import { useState } from 'react'
import type { AuditLog } from '@/api/logs'
import ConfirmModal from '@/components/ConfirmModal'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import ChangeList from './components/details/ChangeList'
import LogDetails from './components/details/LogDetails'
import RevertSection from './components/details/RevertSection'
import LogFilters from './components/LogFilters'
import LogsTable from './components/LogsTable'
import { useLogPage } from './hooks/useLogPage'
import { useRevertAuditEntry } from './hooks/useRevertAuditEntry'
import { logEnumLabel } from './logModel'
import { AUDIT_SCREEN } from './logScreen'

/**
 * What admins did through the panel, and the one screen that can put a field edit back.
 *
 * Everything except the undo is `AUDIT_SCREEN` plus the shared machinery in this folder; the
 * undo is composed in here, as the change list and the confirmation are, rather than switched
 * on by a flag the activity screen would have to switch off.
 */
export default function AuditLogsPage() {
  const auditLogs = useLogPage(AUDIT_SCREEN)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [confirmingRevert, setConfirmingRevert] = useState<AuditLog | null>(null)

  const { revert, reverting, revertError, clearRevertError } = useRevertAuditEntry({
    onReverted: async () => {
      setSelectedLog(null)
      await auditLogs.reload()
    },
  })

  function openLog(log: AuditLog) {
    setSelectedLog(log)
    clearRevertError()
  }

  function confirmRevert(log: AuditLog) {
    setConfirmingRevert(null)
    revert(log)
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
      <LogFilters
        screen={AUDIT_SCREEN}
        draft={auditLogs.draft}
        meta={auditLogs.meta}
        loading={auditLogs.loading}
        onDraftChange={auditLogs.setDraft}
        onApply={auditLogs.applyFilters}
        onClear={auditLogs.clearFilters}
      />
      <ErrorAlert message={auditLogs.tableError} />
      <LogsTable
        screen={AUDIT_SCREEN}
        entries={auditLogs.items}
        hasMore={auditLogs.hasMore}
        loading={auditLogs.loading}
        loadingMore={auditLogs.loadingMore}
        onOpen={openLog}
        onLoadMore={auditLogs.loadMore}
      />
      <LogDetails
        screen={AUDIT_SCREEN}
        entry={selectedLog}
        title="Audit Event Details"
        onClose={() => setSelectedLog(null)}
      >
        {selectedLog && (
          <>
            <ChangeList changes={selectedLog.changes} />
            <RevertSection
              log={selectedLog}
              reverting={reverting}
              revertError={revertError}
              onRevert={setConfirmingRevert}
            />
          </>
        )}
      </LogDetails>
      {confirmingRevert && (
        <ConfirmModal
          opened
          title="Undo this change"
          description={`Put the fields this ${logEnumLabel(confirmingRevert.action)} entry changed back to what they were? The undo is recorded as its own audit entry.`}
          confirmLabel="Undo the change"
          confirmColor="orange"
          onConfirm={() => confirmRevert(confirmingRevert)}
          onClose={() => setConfirmingRevert(null)}
        />
      )}
    </>
  )
}

function AuditPageHeader() {
  return <PageHeader title={AUDIT_SCREEN.title} description={AUDIT_SCREEN.description} />
}

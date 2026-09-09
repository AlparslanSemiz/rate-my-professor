import { useMutation } from '@tanstack/react-query'
import { auditLogsService, type AuditLog } from '@/api/logs'
import { getRevertErrorMessage } from '../auditRevert'

interface RevertOptions {
  /** Re-reads the log. The revert's own entry only exists there. */
  onReverted: () => Promise<void>
}

/**
 * Undoes the field edit an entry recorded. Audit log only — the activity screen never imports
 * this, and its entries carry no `revertible` for it to read.
 *
 * The response is `{ success, message }` and nothing else, so the log is re-read rather than
 * patched: the reversal's own entry appears only there, and this entry only starts reporting
 * `revertedByAuditId` once the backend says so.
 */
export function useRevertAuditEntry({ onReverted }: RevertOptions) {
  const mutation = useMutation({
    mutationFn: (log: AuditLog) => auditLogsService.revert(log.id),
    onSuccess: onReverted,
  })

  return {
    revert: mutation.mutate,
    reverting: mutation.isPending,
    /** A refused revert is a `409` carrying a reason; anything else keeps its own message. */
    revertError: mutation.error ? getRevertErrorMessage(mutation.error) : '',
    clearRevertError: mutation.reset,
  }
}

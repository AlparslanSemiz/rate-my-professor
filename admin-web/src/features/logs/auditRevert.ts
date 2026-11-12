import { ConflictError } from '@/api/client'
import type { RevertBlockedReason } from '@/domain/auditLog'
import { getErrorMessage } from '@/utils/getErrorMessage'

/**
 * Undoing, in the operator's words. The audit half only: what a student did in the app is not
 * the panel's to reverse, so the activity screen imports nothing from here.
 */

/**
 * The five reasons a change cannot be undone. The backend uses the same vocabulary for a
 * button it says to hide and for a revert it refuses, so both are explained from here rather
 * than from two lists that drift.
 */
const REVERT_REFUSALS: Record<RevertBlockedReason, string> = {
  ACTION_NOT_REVERTIBLE:
    'This entry is not a field edit, so there is nothing to put back. Creations, deletions and sign-ins cannot be undone.',
  WINDOW_EXPIRED: 'This change is too old to undo.',
  VALUE_CHANGED:
    'The value changed again after this entry, so undoing it would discard that later change.',
  ALREADY_REVERTED: 'This change has already been undone.',
  TARGET_MISSING: 'The record this entry is about no longer exists.',
}

const UNKNOWN_REVERT_REFUSAL = 'This change cannot be undone.'

/**
 * @param reason the backend's machine-readable code, or null when it named none
 * @returns why the change cannot be undone, in the operator's words; a general message for a
 *          code this panel has not been taught
 */
export function revertRefusalMessage(reason: string | null): string {
  if (reason && reason in REVERT_REFUSALS) {
    return REVERT_REFUSALS[reason as RevertBlockedReason]
  }
  return UNKNOWN_REVERT_REFUSAL
}

/**
 * A refused revert carries one of those reasons; anything else keeps its own message. The
 * fallback is deliberately not "the change may or may not have been undone" — a refusal is a
 * refusal, and the list is re-read either way.
 *
 * @param error whatever the revert mutation rejected with
 * @returns the message to show the operator
 */
export function getRevertErrorMessage(error: unknown) {
  if (error instanceof ConflictError) return revertRefusalMessage(error.reason)
  return getErrorMessage(error, 'The change could not be undone.')
}

import { Button, Text } from '@mantine/core'
import { IconArrowBackUp } from '@tabler/icons-react'
import type { AuditLog } from '@/api/logs'
import ErrorAlert from '@/components/ErrorAlert'
import { chrome, iconSize } from '@/theme'
import { revertRefusalMessage } from '../../auditRevert'
import DetailSection from '@/components/DetailSection'

interface RevertSectionProps {
  log: AuditLog
  reverting: boolean
  revertError: string
  onRevert: (log: AuditLog) => void
}

/**
 * The undo control, and where there is none, why.
 *
 * The backend decides both: `revertible` is not recomputed here — the window it depends on is
 * a backend setting, and a second copy of it would drift.
 */
export default function RevertSection({
  log,
  reverting,
  revertError,
  onRevert,
}: RevertSectionProps) {
  if (log.revertedByAuditId !== null) {
    return (
      <DetailSection label="Undo">
        <Text size="sm" c={chrome.textSecondary}>
          This change has been undone.
        </Text>
        <Text size="xs" c={chrome.textFaint} mt={3}>
          The reversal is its own entry in this log: {log.revertedByAuditId}
        </Text>
      </DetailSection>
    )
  }

  if (!log.revertible) {
    return (
      <DetailSection label="Undo">
        <Text size="sm" c={chrome.textDim}>
          {revertRefusalMessage(log.revertBlockedReason)}
        </Text>
      </DetailSection>
    )
  }

  return (
    <DetailSection label="Undo">
      <Text size="sm" c={chrome.textSecondary} mb={10}>
        Puts the field back to what it was before this change.
      </Text>
      <ErrorAlert message={revertError} mb={10} />
      <Button
        size="xs"
        color="orange"
        variant="light"
        leftSection={<IconArrowBackUp size={iconSize.inline} />}
        loading={reverting}
        onClick={() => onRevert(log)}
      >
        Undo this change
      </Button>
    </DetailSection>
  )
}

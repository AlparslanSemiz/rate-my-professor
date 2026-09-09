import { Modal, Stack, Text } from '@mantine/core'
import type { AuditLog } from '@/api/logs'
import { chrome } from '@/theme'
import { enumLabel } from '@/utils/enumLabel'
import ActorSummary from './ActorSummary'
import AuditChangeList from './AuditChangeList'
import DetailSection from './DetailSection'
import MetadataList from './MetadataList'
import RevertSection from './RevertSection'

interface AuditLogDetailsProps {
  log: AuditLog | null
  reverting: boolean
  revertError: string
  onRevert: (log: AuditLog) => void
  onClose: () => void
}

/** One audit entry in full: who, what target, what changed, and whether it can be undone. */
export default function AuditLogDetails({
  log,
  reverting,
  revertError,
  onRevert,
  onClose,
}: AuditLogDetailsProps) {
  return (
    <Modal opened={log !== null} onClose={onClose} title="Audit Event Details" centered size="lg">
      {log && (
        <Stack gap={16}>
          <ActorSummary log={log} />

          <DetailSection label="Target">
            <Text size="sm" c={chrome.textSecondary}>
              {log.target?.label ?? 'No target'}
            </Text>
            {log.target && (
              <Text size="xs" c={chrome.textFaint} mt={3}>
                {enumLabel(log.target.type)} · {log.target.id}
              </Text>
            )}
          </DetailSection>

          <div>
            <Text size="xs" fw={600} c={chrome.textDim} tt="uppercase" mb={8}>
              Changes
            </Text>
            <AuditChangeList changes={log.changes} />
          </div>

          <RevertSection
            log={log}
            reverting={reverting}
            revertError={revertError}
            onRevert={onRevert}
          />

          <MetadataList metadata={log.metadata} />
        </Stack>
      )}
    </Modal>
  )
}

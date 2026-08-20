import type { ReactNode } from 'react'
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  type CSSProperties,
} from '@mantine/core'
import { IconArrowBackUp } from '@tabler/icons-react'
import type { AuditLog } from '../../../api/AuditLogsService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkModalStyles } from '../../../constants/modalStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { auditActionColor, formatAuditValue, revertRefusalMessage } from '../auditLogModel'
import AuditChangeList from './AuditChangeList'

const detailCardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: '#0f1117',
  border: '1px solid #21262d',
}

interface AuditLogDetailsProps {
  log: AuditLog | null
  reverting: boolean
  revertError: string
  onRevert: (log: AuditLog) => void
  onClose: () => void
}

export default function AuditLogDetails({
  log,
  reverting,
  revertError,
  onRevert,
  onClose,
}: AuditLogDetailsProps) {
  return (
    <Modal
      opened={log !== null}
      onClose={onClose}
      title="Audit Event Details"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {log && (
        <Stack gap={16}>
          <ActorSummary log={log} />
          <DetailSection label="Target">
            <Text size="sm" c="#d1d5db">
              {log.target?.label ?? 'No target'}
            </Text>
            {log.target && (
              <Text size="xs" c="#4b5563" mt={3}>
                {enumLabel(log.target.type)} · {log.target.id}
              </Text>
            )}
          </DetailSection>
          <div>
            <Text size="xs" fw={600} c="#6b7280" tt="uppercase" mb={8}>
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
          {Object.keys(log.metadata).length > 0 && (
            <DetailSection label="Additional context">
              <Stack gap={6}>
                {Object.entries(log.metadata).map(([key, value]) => (
                  <Group key={key} justify="space-between" align="flex-start" wrap="nowrap">
                    <Text size="xs" c="#6b7280">
                      {enumLabel(key)}
                    </Text>
                    <Text size="sm" c="#d1d5db" ta="right">
                      {formatAuditValue(value)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </DetailSection>
          )}
        </Stack>
      )}
    </Modal>
  )
}

/**
 * The undo control, and where there is none, why. The backend decides both: `revertible` is
 * not recomputed here — the window it depends on is a backend setting, and a second copy of
 * it would drift.
 */
function RevertSection({
  log,
  reverting,
  revertError,
  onRevert,
}: {
  log: AuditLog
  reverting: boolean
  revertError: string
  onRevert: (log: AuditLog) => void
}) {
  if (log.revertedByAuditId !== null) {
    return (
      <DetailSection label="Undo">
        <Text size="sm" c="#d1d5db">
          This change has been undone.
        </Text>
        <Text size="xs" c="#4b5563" mt={3}>
          The reversal is its own entry in this log: {log.revertedByAuditId}
        </Text>
      </DetailSection>
    )
  }

  if (!log.revertible) {
    return (
      <DetailSection label="Undo">
        <Text size="sm" c="#6b7280">
          {revertRefusalMessage(log.revertBlockedReason)}
        </Text>
      </DetailSection>
    )
  }

  return (
    <DetailSection label="Undo">
      <Text size="sm" c="#d1d5db" mb={10}>
        Puts the field back to what it was before this change.
      </Text>
      <ErrorAlert message={revertError} mb={10} />
      <Button
        size="xs"
        color="orange"
        variant="light"
        leftSection={<IconArrowBackUp size={14} />}
        loading={reverting}
        onClick={() => onRevert(log)}
      >
        Undo this change
      </Button>
    </DetailSection>
  )
}

function ActorSummary({ log }: { log: AuditLog }) {
  return (
    <Box style={detailCardStyle}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge variant="light" color={auditActionColor(log.action)} mb={8}>
            {enumLabel(log.action)}
          </Badge>
          <Text fw={600} c="#e2e8f0">
            {log.actor.name}
          </Text>
          <Text size="xs" c="#6b7280">
            {log.actor.email} · {enumLabel(log.actor.role)}
          </Text>
        </div>
        <Text size="xs" c="#6b7280">
          {formatDate(log.createdAt, { withTime: true })}
        </Text>
      </Group>
    </Box>
  )
}

function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box style={detailCardStyle}>
      <Text size="xs" fw={600} c="#6b7280" tt="uppercase" mb={6}>
        {label}
      </Text>
      {children}
    </Box>
  )
}

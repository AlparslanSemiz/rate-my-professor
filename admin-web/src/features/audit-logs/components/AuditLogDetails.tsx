import type { ReactNode } from 'react'
import {
  Badge,
  Box,
  Group,
  Modal,
  Stack,
  Text,
  type CSSProperties,
} from '@mantine/core'
import type { AuditLog } from '../../../api/AuditLogsService'
import { darkModalStyles } from '../../../constants/modalStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { auditActionColor, formatAuditValue } from '../auditLogModel'
import AuditChangeList from './AuditChangeList'

const detailCardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: '#0f1117',
  border: '1px solid #21262d',
}

export default function AuditLogDetails({
  log,
  onClose,
}: {
  log: AuditLog | null
  onClose: () => void
}) {
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

import type { ReactNode } from 'react'
import { Badge, Box, Group, Modal, Stack, Text, type CSSProperties } from '@mantine/core'
import type { ActivityLog } from '../../../api/ActivityLogsService'
import { darkModalStyles } from '../../../constants/modalStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import {
  activityTypeColor,
  actorEmail,
  actorName,
  contextEntries,
  formatActivityValue,
  outcomeColor,
} from '../activityLogModel'

const detailCardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: '#0f1117',
  border: '1px solid #21262d',
}

export default function ActivityLogDetails({
  activity,
  onClose,
}: {
  activity: ActivityLog | null
  onClose: () => void
}) {
  return (
    <Modal
      opened={activity !== null}
      onClose={onClose}
      title="Activity Details"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {activity && (
        <Stack gap={16}>
          <ActorSummary activity={activity} />
          <DetailSection label="Target">
            <Text size="sm" c="#d1d5db">
              {activity.target?.label ?? 'No target'}
            </Text>
            {activity.target && (
              <Text size="xs" c="#4b5563" mt={3}>
                {enumLabel(activity.target.type)} · {activity.target.id}
              </Text>
            )}
          </DetailSection>
          <DetailSection label="Where it happened">
            <PairList entries={contextEntries(activity.context)} empty="No request context recorded." />
          </DetailSection>
          {Object.keys(activity.metadata).length > 0 && (
            <DetailSection label="Additional context">
              <PairList
                entries={Object.entries(activity.metadata).map(([key, value]) => [
                  enumLabel(key),
                  formatActivityValue(value),
                ])}
                empty=""
              />
            </DetailSection>
          )}
        </Stack>
      )}
    </Modal>
  )
}

function ActorSummary({ activity }: { activity: ActivityLog }) {
  return (
    <Box style={detailCardStyle}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap={6} mb={8}>
            <Badge variant="light" color={activityTypeColor(activity.type)}>
              {enumLabel(activity.type)}
            </Badge>
            <Badge variant="light" color={outcomeColor(activity.outcome)}>
              {enumLabel(activity.outcome)}
            </Badge>
          </Group>
          <Text fw={600} c="#e2e8f0">
            {actorName(activity.actor)}
          </Text>
          <Text size="xs" c="#6b7280">
            {actorEmail(activity.actor)}
            {activity.actor ? ` · ${enumLabel(activity.actor.role)}` : ''}
          </Text>
        </div>
        <Text size="xs" c="#6b7280">
          {formatDate(activity.createdAt, { withTime: true })}
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

function PairList({ entries, empty }: { entries: Array<[string, string]>; empty: string }) {
  if (entries.length === 0) {
    return (
      <Text size="sm" c="#4b5563">
        {empty}
      </Text>
    )
  }

  return (
    <Stack gap={6}>
      {entries.map(([label, value]) => (
        <Group key={label} justify="space-between" align="flex-start" wrap="nowrap" gap={16}>
          <Text size="xs" c="#6b7280" style={{ whiteSpace: 'nowrap' }}>
            {label}
          </Text>
          <Text size="sm" c="#d1d5db" ta="right" style={{ wordBreak: 'break-word' }}>
            {value}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}

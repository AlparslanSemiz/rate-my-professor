import { SimpleGrid, Text, type CSSProperties } from '@mantine/core'
import Panel from '../../../components/Panel'
import { formatCount, humanizeKey } from '../systemStatusModel'

const tileStyle: CSSProperties = { padding: '16px 18px' }

/**
 * Live record counts straight from the production database. This is how an admin confirms an
 * action landed: block someone, refresh, watch "Blocked users" go up.
 */
export default function SystemCounters({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts)

  if (entries.length === 0) {
    return (
      <Panel style={tileStyle}>
        <Text size="sm" c="#6b7280">
          The backend did not report any counters.
        </Text>
      </Panel>
    )
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing={12}>
      {entries.map(([key, value]) => (
        <Panel key={key} style={tileStyle}>
          <Text fw={700} c="#f1f5f9" style={{ fontSize: 22, lineHeight: 1 }}>
            {formatCount(value)}
          </Text>
          <Text size="xs" c="#6b7280" mt={4}>
            {humanizeKey(key)}
          </Text>
        </Panel>
      ))}
    </SimpleGrid>
  )
}

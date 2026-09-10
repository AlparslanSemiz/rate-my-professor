import type { ReactNode } from 'react'
import { Modal, Stack, Text } from '@mantine/core'
import type { AuditEntry } from '@/api/logs'
import { chrome } from '@/theme'
import { logEnumLabel } from '../../logModel'
import type { LogScreen } from '../../logScreen'
import ActorSummary from './ActorSummary'
import DetailSection from '@/components/DetailSection'
import MetadataList from './MetadataList'

interface LogDetailsProps<TEntry extends AuditEntry> {
  screen: LogScreen<TEntry>
  entry: TEntry | null
  title: string
  /** What a metadata list with nothing in it should say, or nothing at all when it should vanish. */
  metadataEmptyText?: string
  /**
   * Whatever this screen shows between the target and the metadata.
   *
   * A slot rather than a flag, and that is the point: the audit page passes its change list and
   * its undo section, the activity page passes nothing, and this component never learns that
   * undoing exists. The activity screen is typed on `AuditEntry`, which carries no
   * `revertible` — so there is nothing for an undo control to read even if one were written.
   */
  children?: ReactNode
  onClose: () => void
}

/** One log entry in full: who, what target, whatever the screen adds, and what else was recorded. */
export default function LogDetails<TEntry extends AuditEntry>({
  screen,
  entry,
  title,
  metadataEmptyText,
  children,
  onClose,
}: LogDetailsProps<TEntry>) {
  return (
    <Modal opened={entry !== null} onClose={onClose} title={title} centered size="lg">
      {entry && (
        <Stack gap={16}>
          <ActorSummary entry={entry} actionColor={screen.actionColor} />

          <DetailSection label="Target">
            <Text size="sm" c={chrome.textSecondary}>
              {entry.target?.label ?? 'No target'}
            </Text>
            {entry.target && (
              <Text size="xs" c={chrome.textFaint} mt={3}>
                {logEnumLabel(entry.target.type)} · {entry.target.id}
              </Text>
            )}
          </DetailSection>

          {children}

          <MetadataList metadata={entry.metadata} emptyText={metadataEmptyText} />
        </Stack>
      )}
    </Modal>
  )
}

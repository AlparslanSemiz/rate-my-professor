import { useState } from 'react'
import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconClock, IconUser } from '@tabler/icons-react'
import type { Warning } from '@/api/users'
import { KIT } from '@/constants/colors'
import { formatDate } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import WarningActions from './warnings/WarningActions'
import WarningEditor from './warnings/WarningEditor'
import { chrome, iconSize } from '@/theme'

/**
 * The empty state here sits inside a modal, so it is drawn smaller than the page-level
 * `iconSize.emptyState`. That the two differ is drift, recorded rather than quietly unified.
 */
const EMPTY_ICON_SIZE = 20


const sectionTitleStyle: CSSProperties = { letterSpacing: '0.05em' }
const emptyWarningsStyle: CSSProperties = {
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
  borderRadius: 8,
  padding: '16px',
  textAlign: 'center',
}
const warningListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const warningItemStyle: CSSProperties = {
  background: chrome.surfaceSunken,
  border: '1px solid rgba(234,179,8,0.15)',
  borderLeft: `3px solid ${KIT.yellow}`,
  borderRadius: 8,
  padding: '10px 14px',
}

function warningKey(warning: Warning) {
  return warning.id ?? `${warning.createdAt}-${warning.issuedBy}-${warning.message}`
}

interface WarningHistoryProps {
  warnings: readonly Warning[]
  busy: boolean
  onEdit: (warning: Warning, message: string) => Promise<void>
  onWithdraw: (warning: Warning) => void
}

export default function WarningHistory({
  warnings,
  busy,
  onEdit,
  onWithdraw,
}: WarningHistoryProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  function startEditing(warning: Warning) {
    setEditingKey(warningKey(warning))
    setDraft(warning.message)
    setError('')
  }

  function stopEditing() {
    setEditingKey(null)
    setDraft('')
    setError('')
  }

  async function save(warning: Warning) {
    const message = draft.trim()
    if (!message || message === warning.message) {
      stopEditing()
      return
    }

    setError('')
    try {
      await onEdit(warning, message)
      stopEditing()
    } catch (saveError: unknown) {
      // The editor stays open with the text still in it, so a refused correction is
      // reported rather than silently discarded along with what was typed.
      setError(getErrorMessage(saveError, 'The correction could not be saved.'))
    }
  }

  return (
    <Box>
      <Group gap={6} mb={12}>
        <IconClock size={iconSize.compact} color={chrome.textDim} />
        <Text size="xs" fw={600} c={chrome.textDim} tt="uppercase" style={sectionTitleStyle}>
          Warning history ({warnings.length})
        </Text>
      </Group>
      {warnings.length === 0 ? (
        <Box style={emptyWarningsStyle}>
          <IconUser size={EMPTY_ICON_SIZE} color={chrome.iconFaint} style={{ marginBottom: 6 }} />
          <Text size="xs" c={chrome.textFaint}>
            No warnings issued.
          </Text>
        </Box>
      ) : (
        <div style={warningListStyle}>
          {warnings.map((warning) => {
            const key = warningKey(warning)
            const isEditing = editingKey === key

            return (
              <Box key={key} style={warningItemStyle}>
                {isEditing ? (
                  <WarningEditor
                    draft={draft}
                    error={error}
                    busy={busy}
                    onDraftChange={setDraft}
                    onCancel={stopEditing}
                    onSave={() => void save(warning)}
                  />
                ) : (
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap={10}>
                    <div>
                      <Text size="sm" c={chrome.textSecondary} mb={4}>
                        {warning.message}
                      </Text>
                      <Text size="xs" c={chrome.textFaint}>
                        {formatDate(warning.createdAt, { withTime: true })} · Issued by{' '}
                        {warning.issuedByName}
                      </Text>
                    </div>
                    <WarningActions
                      warning={warning}
                      busy={busy}
                      onEdit={() => startEditing(warning)}
                      onWithdraw={() => onWithdraw(warning)}
                    />
                  </Group>
                )}
              </Box>
            )
          })}
        </div>
      )}
    </Box>
  )
}

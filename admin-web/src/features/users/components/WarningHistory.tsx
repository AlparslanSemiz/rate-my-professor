import { useState } from 'react'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Text,
  Textarea,
  Tooltip,
  type CSSProperties,
} from '@mantine/core'
import { IconCheck, IconClock, IconPencil, IconTrash, IconUser, IconX } from '@tabler/icons-react'
import type { Warning } from '../../../api/UsersService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { formatDate } from '../../../utils/formatDate'
import { getErrorMessage } from '../../../utils/getErrorMessage'

const sectionTitleStyle: CSSProperties = { letterSpacing: '0.05em' }
const emptyWarningsStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
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
  background: '#0f1117',
  border: '1px solid rgba(234,179,8,0.15)',
  borderLeft: '3px solid #eab308',
  borderRadius: 8,
  padding: '10px 14px',
}

function warningKey(warning: Warning) {
  return warning.id ?? `${warning.createdAt}-${warning.issuedBy}-${warning.message}`
}

interface WarningHistoryProps {
  warnings: Warning[]
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
        <IconClock size={13} color="#6b7280" />
        <Text size="xs" fw={600} c="#6b7280" tt="uppercase" style={sectionTitleStyle}>
          Warning history ({warnings.length})
        </Text>
      </Group>
      {warnings.length === 0 ? (
        <Box style={emptyWarningsStyle}>
          <IconUser size={20} color="#374151" style={{ marginBottom: 6 }} />
          <Text size="xs" c="#4b5563">
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
                  <>
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.currentTarget.value)}
                      minRows={2}
                      size="xs"
                      mb={8}
                      aria-label="Warning message"
                      styles={darkInputStyles}
                    />
                    <ErrorAlert message={error} mb={8} />
                    <Group gap={6} justify="flex-end">
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        leftSection={<IconX size={12} />}
                        onClick={stopEditing}
                        disabled={busy}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="compact-xs"
                        color="yellow"
                        leftSection={<IconCheck size={12} />}
                        loading={busy}
                        disabled={!draft.trim()}
                        onClick={() => void save(warning)}
                      >
                        Save
                      </Button>
                    </Group>
                  </>
                ) : (
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap={10}>
                    <div>
                      <Text size="sm" c="#d1d5db" mb={4}>
                        {warning.message}
                      </Text>
                      <Text size="xs" c="#4b5563">
                        {formatDate(warning.createdAt, { withTime: true })}
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

interface WarningActionsProps {
  warning: Warning
  busy: boolean
  onEdit: () => void
  onWithdraw: () => void
}

/**
 * A warning can only be corrected or withdrawn when the backend told us its id. The warning
 * history does not carry one yet, so the controls stay hidden rather than offering an action
 * that has nothing to address.
 */
function WarningActions({ warning, busy, onEdit, onWithdraw }: WarningActionsProps) {
  if (warning.id === null) return null

  return (
    <Group gap={2} wrap="nowrap">
      <Tooltip label="Correct the wording" withArrow>
        <ActionIcon
          variant="subtle"
          color="yellow"
          size="sm"
          disabled={busy}
          aria-label="Edit warning"
          onClick={onEdit}
        >
          <IconPencil size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Withdraw this warning" withArrow>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          disabled={busy}
          aria-label="Withdraw warning"
          onClick={onWithdraw}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

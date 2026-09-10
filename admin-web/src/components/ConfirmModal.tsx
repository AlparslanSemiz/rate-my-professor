import { useEffect, useState } from 'react'
import { Modal, Text, Group, Button, type MantineColor } from '@mantine/core'
import { getErrorMessage } from '@/utils/getErrorMessage'
import ErrorAlert from './ErrorAlert'
import { chrome } from '@/theme'

interface ConfirmModalProps {
  opened: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  /**
   * Awaited, so the button can show progress and a failure can be reported in place. A
   * caller that closes this modal before acting — because it reports the outcome somewhere
   * else — returns nothing instead, and gets neither.
   */
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ opened, title, description, confirmLabel, confirmColor, onConfirm, onClose }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Puts focus back where it came from when this closes.
   *
   * Mantine restores focus itself, but only for a modal that is still mounted when it closes.
   * Three of the four callers render this as `{confirming && <ConfirmModal opened … />}`, so
   * dismissing it unmounts the whole thing in the same tick and there is nothing left to do
   * the restoring — Escape left a keyboard operator on `document.body`, at the top of the
   * document, with no idea where they had been. `AdminLayout` already treats exactly this as a
   * defect for its own notice, and the fix is here rather than at the three call sites because
   * a fourth caller would have had to remember.
   *
   * Keyed on `opened` rather than on mount, so it is right for both shapes of caller. A
   * confirmed action often removes the row that opened it; focusing a detached element is a
   * no-op and focus stays on the body, which is the correct outcome — that control is gone.
   */
  useEffect(() => {
    if (!opened) return
    const opener = document.activeElement
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [opened])

  function handleClose() {
    setError('')
    onClose()
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      handleClose()
    } catch (confirmError: unknown) {
      setError(getErrorMessage(confirmError, 'The action could not be completed. No changes were saved.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered
      size="sm"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      <Text size="sm" c={chrome.textMuted} mb={20}>
        {description}
      </Text>
      <ErrorAlert message={error} />
      <Group justify="flex-end" gap={10}>
        <Button variant="subtle" color="gray" size="sm" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button color={confirmColor} size="sm" loading={loading} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  )
}

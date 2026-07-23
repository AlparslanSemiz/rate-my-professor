import { useState } from 'react'
import { Modal, Text, Group, Button } from '@mantine/core'
import type { MantineColor } from '@mantine/core'
import { darkModalStyles } from '../constants/modalStyles'
import { getErrorMessage } from '../utils/getErrorMessage'
import ErrorAlert from './ErrorAlert'

interface ConfirmModalProps {
  opened: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ opened, title, description, confirmLabel, confirmColor, onConfirm, onClose }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      styles={darkModalStyles}
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      <Text size="sm" c="#9ca3af" mb={20}>
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

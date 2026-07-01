import { useState } from 'react'
import { Modal, Text, Group, Button } from '@mantine/core'
import { darkModalStyles } from '../constants/modalStyles'

interface ConfirmModalProps {
  opened: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ opened, title, description, confirmLabel, confirmColor, onConfirm, onClose }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="sm"
      styles={darkModalStyles}
    >
      <Text size="sm" c="#9ca3af" mb={20}>
        {description}
      </Text>
      <Group justify="flex-end" gap={10}>
        <Button variant="subtle" color="gray" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button color={confirmColor} size="sm" loading={loading} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  )
}

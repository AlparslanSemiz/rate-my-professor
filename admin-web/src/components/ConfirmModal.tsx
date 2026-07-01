import { useState } from 'react'
import { Modal, Text, Group, Button } from '@mantine/core'

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
      styles={{
        content: { background: '#161b22', border: '1px solid #21262d' },
        header: { background: '#161b22', borderBottom: '1px solid #21262d' },
        title: { color: '#f1f5f9', fontWeight: 600 },
        close: { color: '#6b7280' },
      }}
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

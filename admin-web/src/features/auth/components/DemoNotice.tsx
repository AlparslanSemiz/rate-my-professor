import { Alert } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'

/**
 * Shown only in the public demo build (`VITE_MOCK_BACKEND=true`), where the mock backend
 * answers every request in the browser. A visitor has no admin account, so the card tells
 * them which address the panel accepts and that any code works.
 */
export default function DemoNotice() {
  return (
    <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light" mb={20} title="Demo">
      No real backend: data lives in your browser and resets on reload. Sign in with{' '}
      <strong>u-kisi4@student.kit.edu</strong> and any 6-digit code.
    </Alert>
  )
}

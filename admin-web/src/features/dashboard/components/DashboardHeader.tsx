import { Text, type CSSProperties } from '@mantine/core'
import { useAuth } from '../../../context/useAuth'

const titleStyle: CSSProperties = { fontSize: 32, lineHeight: 1.1 }

/** The name the account signed in with, falling back to the address when it carries no name. */
function greetingName(name: string | undefined, email: string | undefined) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  return email?.split('@')[0] ?? 'there'
}

export default function DashboardHeader() {
  const { user } = useAuth()

  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={titleStyle}>
        Welcome back, {greetingName(user?.name, user?.email)}
      </Text>
      <Text size="sm" c="#6b7280" mb={32}>
        A quick look at how your community's doing today.
      </Text>
    </>
  )
}

import { Text, type CSSProperties } from '@mantine/core'

const titleStyle: CSSProperties = { fontSize: 32, lineHeight: 1.1 }

export default function DashboardHeader() {
  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={titleStyle}>
        Dashboard
      </Text>
      <Text size="sm" c="#6b7280" mb={32}>
        A quick look at how your community's doing today.
      </Text>
    </>
  )
}

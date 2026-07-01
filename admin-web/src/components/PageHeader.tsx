import { Text } from '@mantine/core'

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1.1 }}>
        {title}
      </Text>
      <Text size="sm" c="#6b7280" mb={28}>
        {description}
      </Text>
    </>
  )
}

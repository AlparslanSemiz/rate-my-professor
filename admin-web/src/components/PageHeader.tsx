import { Text } from '@mantine/core'
import type { CSSProperties } from 'react'

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header style={headerStyle}>
      <Text component="h1" fw={700} c="#f1f5f9" mb={4} style={titleStyle}>
        {title}
      </Text>
      <Text component="p" size="sm" c="#6b7280" m={0}>
        {description}
      </Text>
    </header>
  )
}

const headerStyle: CSSProperties = {
  marginBottom: 28,
}

const titleStyle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1.1,
}

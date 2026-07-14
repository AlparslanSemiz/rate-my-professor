import { Text } from '@mantine/core'
import type { CSSProperties } from 'react'

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={accentRowStyle}>
        <span style={accentBarStyle} aria-hidden />
        <Text component="h1" fw={700} c="#f5f6f8" style={titleStyle}>
          {title}
        </Text>
      </div>
      <Text component="p" size="sm" c="#8a93a1" m={0} style={descriptionStyle}>
        {description}
      </Text>
    </header>
  )
}

const headerStyle: CSSProperties = {
  marginBottom: 28,
}

const accentRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 6,
}

const accentBarStyle: CSSProperties = {
  width: 4,
  height: 26,
  borderRadius: 999,
  background: 'linear-gradient(180deg, #34d17a, #16a34a)',
  boxShadow: '0 0 12px rgba(34,197,94,0.5)',
  flexShrink: 0,
}

const titleStyle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
}

const descriptionStyle: CSSProperties = {
  marginLeft: 16,
  lineHeight: 1.5,
}

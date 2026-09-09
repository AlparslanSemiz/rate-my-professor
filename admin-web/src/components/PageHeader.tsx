import { Text } from '@mantine/core'
import type { CSSProperties } from 'react'
import { KIT, KIT_GREEN_PUBLISHED } from '@/constants/colors'
import { withAlpha } from '@/utils/color'
import { chrome } from '@/theme'

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={accentRowStyle}>
        <span style={accentBarStyle} aria-hidden />
        <Text component="h1" fw={700} c={chrome.textBright} style={titleStyle}>
          {title}
        </Text>
      </div>
      <Text component="p" size="sm" c={chrome.textMuted} m={0} style={descriptionStyle}>
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
  background: `linear-gradient(180deg, ${KIT.green}, ${KIT_GREEN_PUBLISHED})`,
  boxShadow: `0 0 10px ${withAlpha(KIT.green, 0.35)}`,
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

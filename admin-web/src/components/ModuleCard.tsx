import { Badge, Group, Text } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import Panel from './Panel'
import { activateOnEnterOrSpace } from '../utils/keyboard'

interface ModuleCardProps {
  label: string
  title: string
  description: string
  accent: string
  path: string
  onClick: (path: string) => void
}

const BASE_BACKGROUND = 'linear-gradient(180deg, #171b23 0%, #14171e 100%)'
const HOVER_BACKGROUND = 'linear-gradient(180deg, #1c212b 0%, #181c25 100%)'
const BASE_BORDER = '#232935'

const cardStyle: CSSProperties = {
  padding: '18px 20px',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
}

export default function ModuleCard({ label, title, description, accent, path, onClick }: ModuleCardProps) {
  function openModule() {
    onClick(path)
  }

  function setHoverState(element: HTMLDivElement, hovered: boolean) {
    element.style.borderColor = hovered ? `${accent}55` : BASE_BORDER
    element.style.background = hovered ? HOVER_BACKGROUND : BASE_BACKGROUND
    element.style.transform = hovered ? 'translateY(-2px)' : 'translateY(0)'
    element.style.boxShadow = hovered
      ? `0 1px 2px rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.28), 0 0 0 1px ${accent}22`
      : '0 1px 2px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.16)'
  }

  return (
    <Panel
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onClick={openModule}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openModule)}
      style={cardStyle}
      onMouseEnter={(event) => setHoverState(event.currentTarget, true)}
      onMouseLeave={(event) => setHoverState(event.currentTarget, false)}
    >
      <Badge
        size="xs"
        variant="light"
        style={{
          background: `${accent}18`,
          color: accent,
          borderColor: `${accent}30`,
          marginBottom: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Badge>
      <Text fw={600} c="#e2e8f0" size="sm" mb={6}>
        {title}
      </Text>
      <Text size="xs" c="#6b7280" mb={14} lh={1.5}>
        {description}
      </Text>
      <Group gap={4} style={{ color: accent }}>
        <Text size="xs" fw={500} c={accent}>
          Open
        </Text>
        <IconArrowRight size={12} color={accent} />
      </Group>
    </Panel>
  )
}

import { Badge, Group, Text } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import Panel from './Panel'

interface ModuleCardProps {
  label: string
  title: string
  description: string
  accent: string
  path: string
  onClick: (path: string) => void
}

const BASE_BACKGROUND = '#161b22'
const HOVER_BACKGROUND = '#1c2128'
const BASE_BORDER = '#21262d'

const cardStyle: CSSProperties = {
  padding: '18px 20px',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
}

export default function ModuleCard({ label, title, description, accent, path, onClick }: ModuleCardProps) {
  function openModule() {
    onClick(path)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openModule()
    }
  }

  function setHoverState(element: HTMLDivElement, hovered: boolean) {
    element.style.borderColor = hovered ? `${accent}55` : BASE_BORDER
    element.style.background = hovered ? HOVER_BACKGROUND : BASE_BACKGROUND
  }

  return (
    <Panel
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onClick={openModule}
      onKeyDown={handleKeyDown}
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

import { Badge, Group, Text } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import Panel from './Panel'
import { activateOnEnterOrSpace } from '@/utils/keyboard'
import { chrome, iconSize } from '@/theme'

interface ModuleCardProps {
  label: string
  title: string
  description: string
  accent: string
  path: string
  onClick: (path: string) => void
}

const cardStyle: CSSProperties = {
  padding: '18px 20px',
  cursor: 'pointer',
}

export default function ModuleCard({ label, title, description, accent, path, onClick }: ModuleCardProps) {
  function openModule() {
    onClick(path)
  }

  return (
    <Panel
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onClick={openModule}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openModule)}
      className="card-interactive"
      // The card's own colour, read by `.card-interactive:hover` for its border and glow.
      style={{ ...cardStyle, '--accent': accent } as CSSProperties}
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
      <Text fw={600} c={chrome.textPrimary} size="sm" mb={6}>
        {title}
      </Text>
      <Text size="xs" c={chrome.textDim} mb={14} lh={1.5}>
        {description}
      </Text>
      <Group gap={4} style={{ color: accent }}>
        <Text size="xs" fw={500} c={accent}>
          Open
        </Text>
        <IconArrowRight size={iconSize.badge} color={accent} />
      </Group>
    </Panel>
  )
}

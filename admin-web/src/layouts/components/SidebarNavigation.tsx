import { Box, Stack, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import {
  MAIN_NAV_ITEMS,
  type NavigationItem,
} from './sidebarItems'

const ACTIVE_COLOR = '#22c55e'
const NAV_HOVER_BACKGROUND = 'rgba(255,255,255,0.04)'

const buttonBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  transition: 'background 0.18s ease, box-shadow 0.18s ease',
  cursor: 'pointer',
  width: '100%',
}

function navButtonStyle(active: boolean): CSSProperties {
  return {
    ...buttonBaseStyle,
    background: active
      ? 'linear-gradient(180deg, rgba(34,197,94,0.14), rgba(34,197,94,0.06))'
      : 'transparent',
    border: active ? '1px solid rgba(34,197,94,0.22)' : '1px solid transparent',
    boxShadow: active
      ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 14px rgba(34,197,94,0.10)'
      : 'none',
  }
}

function navIconStyle(active: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: active ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255,255,255,0.05)',
    boxShadow: active
      ? '0 0 0 1px rgba(34,197,94,0.22), 0 2px 10px rgba(34,197,94,0.18)'
      : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.18s ease, box-shadow 0.18s ease',
  }
}

function setInactiveBackground(element: HTMLElement, active: boolean, background: string) {
  if (!active) element.style.background = background
}

export default function SidebarNavigation({
  activePath,
  onNavigate,
}: {
  activePath: string
  onNavigate: (path: string) => void
}) {
  return (
    <Stack component="nav" aria-label="Main navigation" gap={2} p={12}>
      {MAIN_NAV_ITEMS.map((item) => (
        <SidebarNavButton
          key={item.path}
          item={item}
          active={activePath === item.path}
          onNavigate={onNavigate}
        />
      ))}
    </Stack>
  )
}

export function SidebarNavButton({
  item,
  active,
  onNavigate,
}: {
  item: NavigationItem
  active: boolean
  onNavigate: (path: string) => void
}) {
  const Icon = item.icon

  return (
    <UnstyledButton
      onClick={() => onNavigate(item.path)}
      aria-current={active ? 'page' : undefined}
      style={navButtonStyle(active)}
      onMouseEnter={(event) =>
        setInactiveBackground(event.currentTarget, active, NAV_HOVER_BACKGROUND)
      }
      onMouseLeave={(event) => setInactiveBackground(event.currentTarget, active, 'transparent')}
    >
      <Box style={navIconStyle(active)}>
        <Icon size={16} color={active ? ACTIVE_COLOR : '#6b7280'} />
      </Box>
      <div>
        <Text size="sm" fw={active ? 600 : 400} c={active ? '#f1f5f9' : '#9ca3af'} lh={1.2}>
          {item.label}
        </Text>
        <Text size="xs" c="#4b5563" lh={1.3}>
          {item.sublabel}
        </Text>
      </div>
    </UnstyledButton>
  )
}

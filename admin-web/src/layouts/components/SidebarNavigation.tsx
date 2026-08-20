import { Box, Stack, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import { DEFAULT_ACCENT, moduleAccent } from '../../constants/colors'
import { withAlpha } from '../../utils/color'
import {
  MAIN_NAV_ITEMS,
  type NavigationItem,
} from './sidebarItems'

const INACTIVE_ICON_COLOR = '#6b7280'
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

function navButtonStyle(active: boolean, accent: string): CSSProperties {
  return {
    ...buttonBaseStyle,
    background: active
      ? `linear-gradient(180deg, ${withAlpha(accent, 0.14)}, ${withAlpha(accent, 0.06)})`
      : 'transparent',
    border: active ? `1px solid ${withAlpha(accent, 0.22)}` : '1px solid transparent',
    boxShadow: active
      ? `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 14px ${withAlpha(accent, 0.1)}`
      : 'none',
  }
}

function navIconStyle(active: boolean, accent: string): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: active ? withAlpha(accent, 0.18) : 'rgba(255,255,255,0.05)',
    boxShadow: active
      ? `0 0 0 1px ${withAlpha(accent, 0.22)}, 0 2px 10px ${withAlpha(accent, 0.18)}`
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
  // The section's own colour, so the sidebar and the dashboard card for the same screen
  // agree. The oversight views are not sections and fall back to the panel's green.
  const accent = moduleAccent[item.path] ?? DEFAULT_ACCENT

  return (
    <UnstyledButton
      onClick={() => onNavigate(item.path)}
      aria-current={active ? 'page' : undefined}
      style={navButtonStyle(active, accent)}
      onMouseEnter={(event) =>
        setInactiveBackground(event.currentTarget, active, NAV_HOVER_BACKGROUND)
      }
      onMouseLeave={(event) => setInactiveBackground(event.currentTarget, active, 'transparent')}
    >
      <Box style={navIconStyle(active, accent)}>
        <Icon size={16} color={active ? accent : INACTIVE_ICON_COLOR} />
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

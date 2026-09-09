import { Box, Stack, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import { DEFAULT_ACCENT, moduleAccent } from '@/constants/colors'
import { withAlpha } from '@/utils/color'
import {
  MAIN_NAV_ITEMS,
  type NavigationItem,
} from './sidebarItems'
import { chrome } from '@/theme'

const INACTIVE_ICON_COLOR = chrome.textDim

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
    // Left undeclared when inactive: an inline `transparent` would beat `.nav-interactive`'s
    // hover rule, which is what the old JavaScript handler existed to work around.
    background: active
      ? `linear-gradient(180deg, ${withAlpha(accent, 0.14)}, ${withAlpha(accent, 0.06)})`
      : undefined,
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
      className="nav-interactive"
      style={navButtonStyle(active, accent)}
    >
      <Box style={navIconStyle(active, accent)}>
        <Icon size={16} color={active ? accent : INACTIVE_ICON_COLOR} />
      </Box>
      <div>
        <Text size="sm" fw={active ? 600 : 400} c={active ? chrome.textBright : chrome.textMuted} lh={1.2}>
          {item.label}
        </Text>
        <Text size="xs" c={chrome.textFaint} lh={1.3}>
          {item.sublabel}
        </Text>
      </div>
    </UnstyledButton>
  )
}

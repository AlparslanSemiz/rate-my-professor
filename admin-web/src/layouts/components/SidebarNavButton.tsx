import { Box, Text, UnstyledButton } from '@mantine/core'
import { accentForRoute } from '@/constants/colors'
import { chrome } from '@/theme'
import type { NavigationItem } from './sidebarItems'
import { INACTIVE_ICON_COLOR, navButtonStyle, navIconStyle } from './sidebarNavStyles'

/** The nav icon sits between inline text and a card icon. */
const NAV_ICON_SIZE = 16


interface SidebarNavButtonProps {
  item: NavigationItem
  active: boolean
  onNavigate: (path: string) => void
}

/** One navigation row. Used by the main list and by the oversight list in `Sidebar`. */
export default function SidebarNavButton({ item, active, onNavigate }: SidebarNavButtonProps) {
  const Icon = item.icon
  // The section's own colour, so the sidebar and the dashboard card for the same screen
  // agree. The oversight views are not sections and fall back to the panel's green.
  const accent = accentForRoute(item.path)

  return (
    <UnstyledButton
      onClick={() => onNavigate(item.path)}
      aria-current={active ? 'page' : undefined}
      className="nav-interactive"
      style={navButtonStyle(active, accent)}
    >
      <Box style={navIconStyle(active, accent)}>
        <Icon size={NAV_ICON_SIZE} color={active ? accent : INACTIVE_ICON_COLOR} />
      </Box>
      <div>
        <Text
          size="sm"
          fw={active ? 600 : 400}
          c={active ? chrome.textBright : chrome.textMuted}
          lh={1.2}
        >
          {item.label}
        </Text>
        <Text size="xs" c={chrome.textFaint} lh={1.3}>
          {item.sublabel}
        </Text>
      </div>
    </UnstyledButton>
  )
}

import { Stack } from '@mantine/core'
import { MAIN_NAV_ITEMS } from './sidebarItems'
import SidebarNavButton from './SidebarNavButton'

interface SidebarNavigationProps {
  activePath: string
  onNavigate: (path: string) => void
}

export default function SidebarNavigation({ activePath, onNavigate }: SidebarNavigationProps) {
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

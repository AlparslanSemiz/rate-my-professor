import { AppShell, type CSSProperties } from '@mantine/core'
import AdminRoutes from './AdminRoutes'
import Sidebar from './components/Sidebar'

const NAVBAR_WIDTH = 240

/** Gutters that grow with the viewport, so a wide table is not pinned to the window edge. */
const contentStyle: CSSProperties = {
  padding: 'clamp(16px, 4vw, 32px)',
  minHeight: '100vh',
}

/** The authenticated shell: the sidebar, and whatever screen is routed beside it. */
export default function AdminLayout() {
  return (
    <AppShell navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm' }} padding={0}>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <div style={contentStyle}>
          <AdminRoutes />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}

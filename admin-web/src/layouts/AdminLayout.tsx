import { useRef } from 'react'
import { AppShell, type CSSProperties } from '@mantine/core'
import ErrorAlert from '@/components/ErrorAlert'
import { useAuth } from '@/context/useAuth'
import AdminRoutes from './AdminRoutes'
import Sidebar from './components/Sidebar'

const NAVBAR_WIDTH = 240

const DISMISS_SESSION_NOTICE_LABEL = 'Dismiss session notice'

/** Gutters that grow with the viewport, so a wide table is not pinned to the window edge. */
const contentStyle: CSSProperties = {
  padding: 'clamp(16px, 4vw, 32px)',
  minHeight: '100vh',
}

/**
 * The authenticated shell: the sidebar, and whatever screen is routed beside it.
 *
 * It also carries the one message the shell owes the operator on its own behalf — a stored
 * session `/auth/me` could not confirm. That notice sits **inside** the content gutters rather
 * than spanning the whole window, so the sidebar never moves: a strip above the whole shell
 * would displace the navigation as well, and the navigation is how an operator gets out of a
 * screen that is misbehaving.
 *
 * A page's own errors are rendered by the page, in the same component at its `error` level.
 * When both are showing they stack, session first, and neither hides the other — the point of
 * `F-013` was a failure nobody was told about, and suppressing one to keep the layout tidy
 * would be the same mistake one level up.
 */
export default function AdminLayout() {
  const { sessionCheckError, acknowledgeSessionCheckError } = useAuth()
  const mainRef = useRef<HTMLElement>(null)

  function dismissSessionNotice() {
    // The close button unmounts itself, and focus would otherwise fall to `document.body` —
    // a keyboard user loses their place in the page entirely. Moving it to the main landmark
    // first keeps them where they were working.
    mainRef.current?.focus()
    acknowledgeSessionCheckError()
  }

  return (
    <AppShell navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm' }} padding={0}>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      {/* `tabIndex={-1}` makes the landmark focusable programmatically without putting it in
          the tab order, which is what the dismiss handler above needs. */}
      <AppShell.Main ref={mainRef} tabIndex={-1}>
        <div style={contentStyle}>
          <ErrorAlert
            message={sessionCheckError ?? ''}
            level="warning"
            onDismiss={dismissSessionNotice}
            dismissLabel={DISMISS_SESSION_NOTICE_LABEL}
          />
          <AdminRoutes />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}

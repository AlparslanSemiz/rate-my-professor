import { AppShell } from '@mantine/core'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/Users'
import FeedbackPage from '../pages/Feedback'
import CommentsPage from '../pages/Comments'

export default function AdminLayout() {
  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: {
          background: 'transparent',
          minHeight: '100vh',
        },
        navbar: {
          background: 'linear-gradient(180deg, #12151c 0%, #0f1217 100%)',
          borderRight: '1px solid #1b1f27',
          boxShadow: '1px 0 0 rgba(255,255,255,0.02) inset',
        },
      }}
    >
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <div style={{ padding: 'clamp(16px, 4vw, 32px)', minHeight: '100vh' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/comments" element={<CommentsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AppShell.Main>
    </AppShell>
  )
}

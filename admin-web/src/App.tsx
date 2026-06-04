import { MantineProvider, AppShell } from '@mantine/core'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import FeedbackPage from './pages/Feedback'
import CommentsPage from './pages/Comments'

function AdminLayout() {
  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default function App() {
  return (
    <MantineProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  )
}

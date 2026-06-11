import { MantineProvider, AppShell, createTheme } from '@mantine/core'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import FeedbackPage from './pages/Feedback'
import CommentsPage from './pages/Comments'

const theme = createTheme({
  primaryColor: 'green',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  colors: {
    dark: [
      '#c9d1d9',
      '#b1bac4',
      '#8b949e',
      '#6e7681',
      '#484f58',
      '#30363d',
      '#21262d',
      '#161b22',
      '#0d1117',
      '#010409',
    ],
  },
})

function AdminLayout() {
  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: {
          background: '#0f1117',
          minHeight: '100vh',
        },
        navbar: {
          background: '#111318',
          borderRight: '1px solid #1e2028',
        },
      }}
    >
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <div style={{ padding: '32px 32px 32px 32px', minHeight: '100vh' }}>
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

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
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

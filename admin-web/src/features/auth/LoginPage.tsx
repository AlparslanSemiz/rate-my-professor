import { Box, type CSSProperties } from '@mantine/core'
import { Navigate } from 'react-router-dom'
import ErrorAlert from '@/components/ErrorAlert'
import Panel from '@/components/Panel'
import { useAuth } from '@/context/useAuth'
import LoginCardHeader from './components/LoginCardHeader'
import LoginForms from './components/LoginForms'
import { useLoginFlow } from './hooks/useLoginFlow'
import { chrome } from '@/theme'
import { LOGIN_CARD_MAX_WIDTH } from '@/constants/layout'

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: chrome.surfaceSunken,
}
const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: LOGIN_CARD_MAX_WIDTH,
  borderRadius: 14,
  padding: '36px 32px',
}

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const login = useLoginFlow()

  /*
   * A signed-in admin has nothing to log into here. Leaving the form reachable let a second
   * sign-in run against a live session: a refused code clears the client's token while the
   * stored session stays, so the next request went out unauthenticated, came back 401, and
   * threw the admin out saying their session had ended — which was never true.
   */
  if (isAuthenticated) return <Navigate to={login.redirectTo} replace />

  return (
    <Box style={pageStyle}>
      <Panel style={cardStyle}>
        <LoginCardHeader step={login.step} email={login.form.values.email} />
        <ErrorAlert message={login.error} mb={20} />
        <LoginForms
          form={login.form}
          step={login.step}
          loading={login.loading}
          error={login.error}
          onRequestCode={login.requestCode}
          onVerifyCode={login.verifyCode}
          onUseDifferentEmail={login.useDifferentEmail}
        />
      </Panel>
    </Box>
  )
}

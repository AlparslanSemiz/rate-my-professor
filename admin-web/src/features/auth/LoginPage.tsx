import { Box, type CSSProperties } from '@mantine/core'
import ErrorAlert from '../../components/ErrorAlert'
import Panel from '../../components/Panel'
import LoginCardHeader from './components/LoginCardHeader'
import LoginForms from './components/LoginForms'
import { useLoginFlow } from './hooks/useLoginFlow'

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f1117',
}
const cardStyle: CSSProperties = {
  width: 400,
  borderRadius: 14,
  padding: '36px 32px',
}

export default function LoginPage() {
  const login = useLoginFlow()

  return (
    <Box style={pageStyle}>
      <Panel style={cardStyle}>
        <LoginCardHeader step={login.step} email={login.email} />
        <ErrorAlert message={login.error} mb={20} />
        <LoginForms
          step={login.step}
          email={login.email}
          code={login.code}
          loading={login.loading}
          onEmailChange={login.setEmail}
          onCodeChange={login.setCode}
          onRequestCode={login.requestCode}
          onVerifyCode={login.verifyCode}
          onUseDifferentEmail={login.useDifferentEmail}
        />
      </Panel>
    </Box>
  )
}

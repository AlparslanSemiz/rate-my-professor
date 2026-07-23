import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, Button, Text, Stack, Box } from '@mantine/core'
import { IconShield } from '@tabler/icons-react'
import { useAuth } from '../context/useAuth'
import { authService } from '../api/AuthService'
import { apiClient } from '../api/ApiClient'
import Panel from '../components/Panel'
import { darkInputStyles } from '../constants/inputStyles'
import { getErrorMessage } from '../utils/getErrorMessage'
import { getDemoAdminTokenForEmail } from '../utils/demoAuth'
import { authenticateAdmin, getLoginErrorMessage } from '../auth/authenticateAdmin'
import { routes } from '../constants/routes'
import ErrorAlert from '../components/ErrorAlert'

type Step = 'email' | 'code'

const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'

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

const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 28,
}

const brandMarkStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9,
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const titleStyle: CSSProperties = {
  fontSize: 22,
}

const submitButtonStyle: CSSProperties = {
  fontWeight: 600,
}

const loginInputStyles = {
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  input: { ...darkInputStyles.input, borderRadius: 8 },
}

export default function Login() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    setError('')
    setLoading(true)
    try {
      const demoToken = getDemoAdminTokenForEmail(trimmedEmail)
      if (!demoToken) {
        const response = await authService.requestLoginCode(trimmedEmail)
        if (!response.success) throw new Error(response.message)
      }
      setEmail(trimmedEmail)
      setStep('code')
    } catch (err: unknown) {
      setError(getErrorMessage(err, REQUEST_CODE_ERROR_FALLBACK))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedCode = code.trim()
    if (!trimmedEmail || !trimmedCode) return

    setError('')
    setLoading(true)
    try {
      const authenticated = await authenticateAdmin(trimmedEmail, trimmedCode)
      login(authenticated.token, authenticated.user)
      navigate(routes.dashboard)
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err))
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  function handleUseDifferentEmail() {
    setStep('email')
    setCode('')
    setError('')
  }

  return (
    <div style={pageStyle}>
      <Panel style={cardStyle}>
        <LoginBrand />
        <LoginCopy step={step} email={email} />
        <ErrorAlert message={error} mb={20} />

        {step === 'email' ? (
          <EmailStepForm
            email={email}
            loading={loading}
            onEmailChange={setEmail}
            onSubmit={handleRequestCode}
          />
        ) : (
          <CodeStepForm
            code={code}
            loading={loading}
            onCodeChange={setCode}
            onSubmit={handleVerifyCode}
            onUseDifferentEmail={handleUseDifferentEmail}
          />
        )}
      </Panel>
    </div>
  )
}

function LoginBrand() {
  return (
    <div style={brandRowStyle}>
      <Box style={brandMarkStyle}>
        <IconShield size={20} color="white" />
      </Box>
      <div>
        <Text fw={600} c="#f1f5f9" size="sm" lh={1.2}>
          Admin Panel
        </Text>
        <Text size="xs" c="#4b5563" lh={1.2}>
          Admin toolkit
        </Text>
      </div>
    </div>
  )
}

function LoginCopy({ step, email }: { step: Step; email: string }) {
  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={titleStyle}>
        Sign in
      </Text>
      <Text size="sm" c="#6b7280" mb={24}>
        {step === 'email'
          ? "Pop in your KIT student email and we'll send over a login code."
          : `We just sent a code to ${email} — enter it below.`}
      </Text>
    </>
  )
}

interface EmailStepFormProps {
  email: string
  loading: boolean
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function EmailStepForm({ email, loading, onEmailChange, onSubmit }: EmailStepFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Stack gap={14}>
        <TextInput
          label="Email"
          placeholder="admin@student.kit.edu"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => onEmailChange(event.currentTarget.value)}
          required
          styles={loginInputStyles}
        />
        <Button
          type="submit"
          fullWidth
          mt={6}
          loading={loading}
          disabled={!email.trim()}
          color="green"
          radius="md"
          style={submitButtonStyle}
        >
          Send me a code
        </Button>
      </Stack>
    </form>
  )
}

interface CodeStepFormProps {
  code: string
  loading: boolean
  onCodeChange: (code: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUseDifferentEmail: () => void
}

function CodeStepForm({
  code,
  loading,
  onCodeChange,
  onSubmit,
  onUseDifferentEmail,
}: CodeStepFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Stack gap={14}>
        <TextInput
          label="Login code"
          placeholder="Code from your email"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(event) => onCodeChange(event.currentTarget.value)}
          required
          styles={loginInputStyles}
        />
        <Button
          type="submit"
          fullWidth
          mt={6}
          loading={loading}
          disabled={!code.trim()}
          color="green"
          radius="md"
          style={submitButtonStyle}
        >
          Sign in
        </Button>
        <Button type="button" fullWidth variant="subtle" color="gray" onClick={onUseDifferentEmail}>
          Use a different email
        </Button>
      </Stack>
    </form>
  )
}

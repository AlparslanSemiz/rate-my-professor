import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, Button, Text, Stack, Alert, Box } from '@mantine/core'
import { IconShield, IconAlertCircle } from '@tabler/icons-react'
import { useAuth } from '../context/useAuth'
import { authService } from '../api/AuthService'
import { usersService, type User } from '../api/UsersService'
import { ApiError, apiClient, EMPTY_RESPONSE_MESSAGE } from '../api/ApiClient'
import Panel from '../components/Panel'
import { darkInputStyles } from '../constants/inputStyles'
import { getRequiredAdminUser, hasAdminAccess, normalizeEmail, withRequiredAdminRole } from '../utils/adminAccess'
import { getErrorMessage } from '../utils/getErrorMessage'

type Step = 'email' | 'code'

const LOGIN_ERROR_FALLBACK = 'Login failed'
const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'
const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

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

function findUserByEmail(users: User[], email: string) {
  const normalizedEmail = normalizeEmail(email)
  return users.find((user) => normalizeEmail(user.kitEmail) === normalizedEmail)
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message === EMPTY_RESPONSE_MESSAGE) {
    return ADMIN_ACCESS_ERROR
  }
  return getErrorMessage(error, LOGIN_ERROR_FALLBACK)
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
      const response = await authService.requestLoginCode(trimmedEmail)
      if (!response.success) throw new Error(response.message)
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
      const { token } = await authService.login(trimmedEmail, trimmedCode)
      apiClient.setToken(token)
      const requiredAdminUser = getRequiredAdminUser(trimmedEmail)
      let users: User[] = []
      try {
        users = await usersService.getAll()
      } catch (err: unknown) {
        if (!requiredAdminUser) throw err
      }

      const currentUser = findUserByEmail(users, trimmedEmail)
      if (!currentUser && requiredAdminUser) {
        login(token, requiredAdminUser)
        navigate('/dashboard')
        return
      }
      if (!currentUser) throw new Error('Logged in, but could not find your admin account')
      const adminUser = withRequiredAdminRole(currentUser)
      if (!hasAdminAccess(adminUser)) throw new Error(ADMIN_ACCESS_ERROR)

      login(token, { id: adminUser.id, name: adminUser.username, email: adminUser.kitEmail, role: adminUser.role })
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err))
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <Panel style={cardStyle}>
        <LoginBrand />
        <LoginCopy step={step} email={email} />
        <LoginError message={error} />

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
            onUseDifferentEmail={() => { setStep('email'); setCode(''); setError('') }}
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
          Operation center
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
          ? 'Enter your KIT student email to receive a login code.'
          : `Enter the code sent to ${email}.`}
      </Text>
    </>
  )
}

function LoginError({ message }: { message: string }) {
  if (!message) return null

  return (
    <Alert
      icon={<IconAlertCircle size={14} />}
      color="red"
      mb={20}
      radius="md"
      styles={{ root: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' } }}
    >
      {message}
    </Alert>
  )
}

function EmailStepForm({
  email,
  loading,
  onEmailChange,
  onSubmit,
}: {
  email: string
  loading: boolean
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
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
          onChange={(event) => onEmailChange(event.target.value)}
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
          Send login code
        </Button>
      </Stack>
    </form>
  )
}

function CodeStepForm({
  code,
  loading,
  onCodeChange,
  onSubmit,
  onUseDifferentEmail,
}: {
  code: string
  loading: boolean
  onCodeChange: (code: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUseDifferentEmail: () => void
}) {
  return (
    <form onSubmit={onSubmit}>
      <Stack gap={14}>
        <TextInput
          label="Login code"
          placeholder="Code from your email"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
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
          Sign In
        </Button>
        <Button type="button" fullWidth variant="subtle" color="gray" onClick={onUseDifferentEmail}>
          Use a different email
        </Button>
      </Stack>
    </form>
  )
}

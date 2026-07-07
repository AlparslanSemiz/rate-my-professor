import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, Button, Text, Stack, Alert, Box } from '@mantine/core'
import { IconShield, IconAlertCircle } from '@tabler/icons-react'
import { useAuth } from '../context/useAuth'
import { authService } from '../api/AuthService'
import { usersService } from '../api/UsersService'
import { apiClient } from '../api/ApiClient'
import Panel from '../components/Panel'
import { darkInputStyles } from '../constants/inputStyles'

type Step = 'email' | 'code'

export default function Login() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
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
      setError(err instanceof Error ? err.message : 'Could not send login code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedCode = code.trim()
    if (!trimmedEmail || !trimmedCode) return

    setError('')
    setLoading(true)
    try {
      const { token } = await authService.login(trimmedEmail, trimmedCode)
      apiClient.setToken(token)
      const users = await usersService.getAll()
      const currentUser = users.find((u) => u.kitEmail.toLowerCase() === trimmedEmail.toLowerCase())
      if (!currentUser) throw new Error('Logged in, but could not find your admin account')

      login(token, { id: currentUser.id, name: currentUser.username, email: currentUser.kitEmail, role: currentUser.role })
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1117',
      }}
    >
      <Panel style={{ width: 400, borderRadius: 14, padding: '36px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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

        <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 22 }}>
          Sign in
        </Text>
        <Text size="sm" c="#6b7280" mb={24}>
          {step === 'email'
            ? 'Enter your KIT student email to receive a login code.'
            : `Enter the code sent to ${email}.`}
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={14} />}
            color="red"
            mb={20}
            radius="md"
            styles={{ root: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' } }}
          >
            {error}
          </Alert>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestCode}>
            <Stack gap={14}>
              <TextInput
                label="Email"
                placeholder="admin@student.kit.edu"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                styles={{
                  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
                  input: { ...darkInputStyles.input, borderRadius: 8 },
                }}
              />
              <Button type="submit" fullWidth mt={6} loading={loading} disabled={!email.trim()} color="green" radius="md" style={{ fontWeight: 600 }}>
                Send login code
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <Stack gap={14}>
              <TextInput
                label="Login code"
                placeholder="Code from your email"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                styles={{
                  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
                  input: { ...darkInputStyles.input, borderRadius: 8 },
                }}
              />
              <Button type="submit" fullWidth mt={6} loading={loading} disabled={!code.trim()} color="green" radius="md" style={{ fontWeight: 600 }}>
                Sign In
              </Button>
              <Button
                type="button"
                fullWidth
                variant="subtle"
                color="gray"
                onClick={() => { setStep('email'); setCode(''); setError('') }}
              >
                Use a different email
              </Button>
            </Stack>
          </form>
        )}
      </Panel>
    </div>
  )
}

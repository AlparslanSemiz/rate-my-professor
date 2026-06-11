import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, PasswordInput, Button, Text, Stack, Alert, Box } from '@mantine/core'
import { IconShield, IconAlertCircle } from '@tabler/icons-react'
import { useAuth } from '../context/useAuth'
import { loginRequest } from '../api/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await loginRequest(email, password)
      login(token, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
      <Box
        style={{
          width: 400,
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 14,
          padding: '36px 32px',
        }}
      >
        {/* Logo */}
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
          Enter your credentials to access the admin panel.
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

        <form onSubmit={handleSubmit}>
          <Stack gap={14}>
            <TextInput
              label="Email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              styles={{
                label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
                input: {
                  background: '#0f1117',
                  border: '1px solid #21262d',
                  color: '#e2e8f0',
                  borderRadius: 8,
                },
              }}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              styles={{
                label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
                input: {
                  background: '#0f1117',
                  border: '1px solid #21262d',
                  color: '#e2e8f0',
                  borderRadius: 8,
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              mt={6}
              loading={loading}
              color="green"
              radius="md"
              style={{ fontWeight: 600 }}
            >
              Sign In
            </Button>
          </Stack>
        </form>
      </Box>
    </div>
  )
}

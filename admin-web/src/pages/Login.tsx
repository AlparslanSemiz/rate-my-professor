import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Alert } from '@mantine/core'
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <Paper withBorder shadow="md" p="xl" radius="md" w={380}>
        <Title order={3} mb="xs">Admin Panel</Title>
        <Text size="sm" c="dimmed" mb="lg">Sign in to your account</Text>

        {error && (
          <Alert color="red" mb="md">{error}</Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth mt="sm" loading={loading}>
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  )
}

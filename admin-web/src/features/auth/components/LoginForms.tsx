import { type FormEvent } from 'react'
import { Button, Stack, TextInput, type CSSProperties } from '@mantine/core'
import { darkInputStyles } from '../../../constants/inputStyles'
import type { LoginStep } from '../hooks/useLoginFlow'

const submitButtonStyle: CSSProperties = { fontWeight: 600 }
const loginInputStyles = {
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  input: { ...darkInputStyles.input, borderRadius: 8 },
}

interface LoginFormsProps {
  step: LoginStep
  email: string
  code: string
  loading: boolean
  onEmailChange: (email: string) => void
  onCodeChange: (code: string) => void
  onRequestCode: () => Promise<void>
  onVerifyCode: () => Promise<void>
  onUseDifferentEmail: () => void
}

export default function LoginForms(props: LoginFormsProps) {
  return props.step === 'email' ? <EmailStepForm {...props} /> : <CodeStepForm {...props} />
}

function EmailStepForm({
  email,
  loading,
  onEmailChange,
  onRequestCode,
}: LoginFormsProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onRequestCode()
  }

  return (
    <form onSubmit={handleSubmit}>
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

function CodeStepForm({
  code,
  loading,
  onCodeChange,
  onVerifyCode,
  onUseDifferentEmail,
}: LoginFormsProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onVerifyCode()
  }

  return (
    <form onSubmit={handleSubmit}>
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
        <Button
          type="button"
          fullWidth
          variant="subtle"
          color="gray"
          onClick={onUseDifferentEmail}
        >
          Use a different email
        </Button>
      </Stack>
    </form>
  )
}

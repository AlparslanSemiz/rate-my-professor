import { type FormEvent } from 'react'
import { Button, Stack, TextInput } from '@mantine/core'
import type { LoginFormsProps } from './LoginForms'
import { LOGIN_INPUT_RADIUS, loginInputStyles, submitButtonStyle } from './loginFormStyles'

type EmailStepFormProps = Pick<
  LoginFormsProps,
  'email' | 'loading' | 'onEmailChange' | 'onRequestCode'
>

export default function EmailStepForm({
  email,
  loading,
  onEmailChange,
  onRequestCode,
}: EmailStepFormProps) {
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
          radius={LOGIN_INPUT_RADIUS}
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

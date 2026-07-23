import { type FormEvent } from 'react'
import { Button, Stack, TextInput } from '@mantine/core'
import type { LoginFormsProps } from './LoginForms'
import { loginInputStyles, submitButtonStyle } from './loginFormStyles'

type CodeStepFormProps = Pick<
  LoginFormsProps,
  'code' | 'loading' | 'onCodeChange' | 'onVerifyCode' | 'onUseDifferentEmail'
>

export default function CodeStepForm({
  code,
  loading,
  onCodeChange,
  onVerifyCode,
  onUseDifferentEmail,
}: CodeStepFormProps) {
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

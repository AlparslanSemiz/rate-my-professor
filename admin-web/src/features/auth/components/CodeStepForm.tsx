import { type FormEvent } from 'react'
import { Button, Stack, TextInput } from '@mantine/core'
import { isCompleteLoginCode, LOGIN_CODE_LENGTH } from '../loginModel'
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
          description={`${LOGIN_CODE_LENGTH} characters, from the email we just sent.`}
          placeholder="Code from your email"
          autoComplete="one-time-code"
          maxLength={LOGIN_CODE_LENGTH}
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
          disabled={!isCompleteLoginCode(code)}
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

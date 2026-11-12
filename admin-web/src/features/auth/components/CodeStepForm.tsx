import { Button, Stack, TextInput } from '@mantine/core'
import { isCompleteLoginCode, LOGIN_CODE_LENGTH } from '../loginModel'
import type { LoginFormsProps } from './loginFormsProps'
import { LOGIN_INPUT_RADIUS, loginInputStyles, submitButtonStyle } from './loginFormStyles'

type CodeStepFormProps = Pick<
  LoginFormsProps,
  'form' | 'loading' | 'onVerifyCode' | 'onUseDifferentEmail'
>

export default function CodeStepForm({
  form,
  loading,
  onVerifyCode,
  onUseDifferentEmail,
}: CodeStepFormProps) {
  return (
    <form onSubmit={form.onSubmit(onVerifyCode)}>
      <Stack gap={14}>
        <TextInput
          label="Login code"
          description={`${LOGIN_CODE_LENGTH} characters, from the email we just sent.`}
          placeholder="Code from your email"
          autoComplete="one-time-code"
          maxLength={LOGIN_CODE_LENGTH}
          autoFocus
          required
          styles={loginInputStyles}
          radius={LOGIN_INPUT_RADIUS}
          {...form.getInputProps('code')}
        />
        <Button
          type="submit"
          fullWidth
          mt={6}
          loading={loading}
          disabled={!isCompleteLoginCode(form.values.code)}
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

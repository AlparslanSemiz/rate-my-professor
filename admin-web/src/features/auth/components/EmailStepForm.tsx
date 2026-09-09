import { Button, Stack, TextInput } from '@mantine/core'
import type { LoginFormsProps } from './LoginForms'
import { LOGIN_INPUT_RADIUS, loginInputStyles, submitButtonStyle } from './loginFormStyles'

type EmailStepFormProps = Pick<LoginFormsProps, 'form' | 'loading' | 'onRequestCode'>

export default function EmailStepForm({ form, loading, onRequestCode }: EmailStepFormProps) {
  return (
    <form onSubmit={form.onSubmit(onRequestCode)}>
      <Stack gap={14}>
        <TextInput
          label="Email"
          placeholder="admin@student.kit.edu"
          type="email"
          autoComplete="email"
          autoFocus
          required
          styles={loginInputStyles}
          radius={LOGIN_INPUT_RADIUS}
          {...form.getInputProps('email')}
        />
        <Button
          type="submit"
          fullWidth
          mt={6}
          loading={loading}
          disabled={!form.values.email.trim()}
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

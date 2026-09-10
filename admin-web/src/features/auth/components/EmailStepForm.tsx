import { Button, Stack, TextInput } from '@mantine/core'
import type { LoginFormsProps } from './loginFormsProps'
import {
  LOGIN_EMAIL_WRAPPER_ORDER,
  LOGIN_INPUT_RADIUS,
  loginInputStylesWithHiddenDescription,
  submitButtonStyle,
} from './loginFormStyles'

type EmailStepFormProps = Pick<LoginFormsProps, 'form' | 'loading' | 'onRequestCode' | 'error'>

export default function EmailStepForm({
  form,
  loading,
  onRequestCode,
  error,
}: EmailStepFormProps) {
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
          styles={loginInputStylesWithHiddenDescription}
          radius={LOGIN_INPUT_RADIUS}
          {...form.getInputProps('email')}
          /*
           * `F-031`. An address `adminAccess` refuses never reaches the backend, so the sentence
           * explaining the refusal is rendered in the page-level alert above the form. It was
           * announced once, when the alert appeared, and a screen-reader user who then tabbed
           * back to this field heard nothing about why it had been rejected.
           *
           * `error` is what reports `aria-invalid`; `withErrorStyles={false}` and a wrapper order
           * without `'error'` stop Mantine drawing or colouring anything for it, so the field
           * looks exactly as it did. `description` carries the same sentence into the one slot
           * Mantine will point `aria-describedby` at, hidden from view.
           */
          error={error || undefined}
          withErrorStyles={false}
          inputWrapperOrder={[...LOGIN_EMAIL_WRAPPER_ORDER]}
          description={error || undefined}
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

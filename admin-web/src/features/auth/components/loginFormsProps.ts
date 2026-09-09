import type { LoginForm, LoginStep } from '../hooks/useLoginFlow'

/**
 * Everything the two-step sign-in form needs, whichever step is showing.
 *
 * One shape rather than two because `LoginForms` picks the step and forwards the lot, and the
 * step components take the same props with different halves unused.
 *
 * It has its own module rather than living on `LoginForms`, which is what renders it: the two
 * step components need the type, so declaring it on their parent made each of them import the
 * parent back.
 */
export interface LoginFormsProps {
  form: LoginForm
  step: LoginStep
  loading: boolean
  onRequestCode: () => void
  onVerifyCode: () => void
  onUseDifferentEmail: () => void
}

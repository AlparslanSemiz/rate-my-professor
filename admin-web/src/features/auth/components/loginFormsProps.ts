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
  /**
   * The refusal currently on screen, or `''` when there is none.
   *
   * `LoginPage` renders it in the page-level alert; the email step needs the same sentence to
   * tie it to the field it refuses, so the text travels rather than being looked up.
   */
  error: string
}

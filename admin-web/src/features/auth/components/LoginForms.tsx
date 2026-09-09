import type { LoginForm, LoginStep } from '../hooks/useLoginFlow'
import CodeStepForm from './CodeStepForm'
import EmailStepForm from './EmailStepForm'

export interface LoginFormsProps {
  form: LoginForm
  step: LoginStep
  loading: boolean
  onRequestCode: () => void
  onVerifyCode: () => void
  onUseDifferentEmail: () => void
}

export default function LoginForms(props: LoginFormsProps) {
  return props.step === 'email' ? <EmailStepForm {...props} /> : <CodeStepForm {...props} />
}

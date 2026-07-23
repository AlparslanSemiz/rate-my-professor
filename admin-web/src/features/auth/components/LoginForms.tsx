import type { LoginStep } from '../hooks/useLoginFlow'
import CodeStepForm from './CodeStepForm'
import EmailStepForm from './EmailStepForm'

export interface LoginFormsProps {
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

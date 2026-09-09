import CodeStepForm from './CodeStepForm'
import EmailStepForm from './EmailStepForm'
import type { LoginFormsProps } from './loginFormsProps'

export type { LoginFormsProps }

export default function LoginForms(props: LoginFormsProps) {
  return props.step === 'email' ? <EmailStepForm {...props} /> : <CodeStepForm {...props} />
}

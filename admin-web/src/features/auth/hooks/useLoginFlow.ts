import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm, type UseFormReturnType } from '@mantine/form'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { authService } from '@/api/auth'
import { routes } from '@/constants/routes'
import { useAuth } from '@/context/useAuth'
import { isRequiredAdminEmail } from '@/utils/adminAccess'
import {
  authenticateAdmin,
  getLoginErrorMessage,
  getRequestCodeErrorMessage,
  NOT_AN_ADMIN_ERROR,
} from '../authenticateAdmin'
import { attemptedPath, isCompleteLoginCode } from '../loginModel'

export type LoginStep = 'email' | 'code'

export interface LoginDraft {
  email: string
  code: string
}

const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'
export const SESSION_EXPIRED_MESSAGE =
  'Your session ended because the server no longer accepts it. Sign in again to continue.'

export function useLoginFlow() {
  const form = useForm<LoginDraft>({ initialValues: { email: '', code: '' } })
  const [step, setStep] = useState<LoginStep>('email')
  const [refusedEmail, setRefusedEmail] = useState('')
  const { login, sessionExpired, acknowledgeExpiry } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  /**
   * Where a successful sign-in lands. Read once here rather than at the call site, because
   * two things navigate away from this screen — the verified code below, and the page's own
   * guard for an admin who is already signed in — and they must agree on the destination.
   */
  const redirectTo = attemptedPath(location.state) ?? routes.dashboard

  const requestCodeMutation = useMutation({
    // A refused request is already an ApiError: the client rejects any body reporting
    // `success: false`, so resolving here means the code was sent.
    mutationFn: (email: string) => authService.requestLoginCode(email),
    onSuccess: () => setStep('code'),
  })

  const verifyCodeMutation = useMutation({
    mutationFn: ({ email, code }: LoginDraft) => authenticateAdmin(email, code),
    onSuccess: (authenticated) => {
      login(authenticated.token, authenticated.user)
      navigate(redirectTo, { replace: true })
    },
    onError: () => apiClient.setToken(null),
  })

  function requestCode() {
    const email = form.values.email.trim()
    if (!email) return

    form.setFieldValue('email', email)
    acknowledgeExpiry()
    setRefusedEmail('')

    // Checked before the request is made, so an address outside the team never causes a login
    // code to be sent. The backend is still what actually authorizes anything, and
    // `authenticateAdmin` checks again — the field is editable between the two steps.
    if (!isRequiredAdminEmail(email)) {
      setRefusedEmail(NOT_AN_ADMIN_ERROR)
      return
    }

    requestCodeMutation.mutate(email)
  }

  function verifyCode() {
    const email = form.values.email.trim()
    const code = form.values.code.trim()
    // The form disables the button on the same check, so this only catches a submit that
    // reached the hook another way — an Enter press, or a caller that is not the form.
    if (!email || !isCompleteLoginCode(code)) return

    acknowledgeExpiry()
    setRefusedEmail('')
    verifyCodeMutation.mutate({ email, code })
  }

  function useDifferentEmail() {
    setStep('email')
    // The address is kept so it can be corrected rather than retyped.
    form.setFieldValue('code', '')
    setRefusedEmail('')
    requestCodeMutation.reset()
    verifyCodeMutation.reset()
  }

  const error =
    refusedEmail ||
    (requestCodeMutation.error
      ? getRequestCodeErrorMessage(requestCodeMutation.error, REQUEST_CODE_ERROR_FALLBACK)
      : '') ||
    (verifyCodeMutation.error ? getLoginErrorMessage(verifyCodeMutation.error) : '')

  return {
    form,
    step,
    redirectTo,
    // An expiry notice is shown until something replaces it: a real login error, or the admin
    // starting a fresh attempt.
    error: error || (sessionExpired ? SESSION_EXPIRED_MESSAGE : ''),
    loading: requestCodeMutation.isPending || verifyCodeMutation.isPending,
    requestCode,
    verifyCode,
    useDifferentEmail,
  }
}

export type LoginForm = UseFormReturnType<LoginDraft>

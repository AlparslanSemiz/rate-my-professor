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

/** Which half of the two-step sign-in is showing. */
export type LoginStep = 'email' | 'code'

/** What the sign-in form holds. Both fields exist from the start; the step decides what is shown. */
export interface LoginDraft {
  email: string
  code: string
}

const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'
/**
 * Shown when the operator is sent back here by a refused token rather than by signing out.
 * Exported so the routing test asserts the message instead of a substring of it.
 */
export const SESSION_EXPIRED_MESSAGE =
  'Your session ended because the server no longer accepts it. Sign in again to continue.'

/**
 * The whole sign-in flow: the form, which step it is on, and what each button does.
 *
 * The admin-list check runs **twice** — before a code is requested and again before it is
 * exchanged. That is not redundancy: the address field stays editable between the two steps,
 * and `/auth/login` serves students as well.
 *
 * On success the operator lands wherever they were trying to reach, which travels in the
 * router's `state.from` rather than in a query parameter, so it cannot be tampered with by
 * editing the URL.
 *
 * @returns the form, the current step, the pending and error state, and the three commands
 */
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
    // A refused request has already been raised as a typed error: the client rejects any body reporting
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

/**
 * The form object, as the step components receive it.
 *
 * Named here rather than written out at each component, so that swapping the form library
 * would be one type to change rather than four.
 */
export type LoginForm = UseFormReturnType<LoginDraft>

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '../../../api/ApiClient'
import { authService } from '../../../api/AuthService'
import { routes } from '../../../constants/routes'
import { useAuth } from '../../../context/useAuth'
import { isRequiredAdminEmail } from '../../../utils/adminAccess'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import {
  authenticateAdmin,
  getLoginErrorMessage,
  NOT_AN_ADMIN_ERROR,
} from '../authenticateAdmin'

export type LoginStep = 'email' | 'code'

const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'
export const SESSION_EXPIRED_MESSAGE =
  'Your session ended because the server no longer accepts it. Sign in again to continue.'

/** The path the admin was denied, carried here by ProtectedRoute's redirect. */
function attemptedPath(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('from' in state)) return null
  const from = (state as { from: unknown }).from
  if (typeof from !== 'string' || !from.startsWith('/') || from === routes.login) return null
  return from
}

export function useLoginFlow() {
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, sessionExpired, acknowledgeExpiry } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function requestCode() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    // Checked before the request is made, so an address outside the team never causes a login
    // code to be sent. The backend is still what actually authorizes anything.
    if (!isRequiredAdminEmail(trimmedEmail)) {
      setEmail(trimmedEmail)
      acknowledgeExpiry()
      setError(NOT_AN_ADMIN_ERROR)
      return
    }

    acknowledgeExpiry()
    setError('')
    setLoading(true)
    try {
      // A refused request is already an ApiError: the client rejects any body reporting
      // `success: false`, so reaching this line means the code was sent.
      await authService.requestLoginCode(trimmedEmail)
      setEmail(trimmedEmail)
      setStep('code')
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, REQUEST_CODE_ERROR_FALLBACK))
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    const trimmedEmail = email.trim()
    const trimmedCode = code.trim()
    if (!trimmedEmail || !trimmedCode) return

    acknowledgeExpiry()
    setError('')
    setLoading(true)
    try {
      const authenticated = await authenticateAdmin(trimmedEmail, trimmedCode)
      login(authenticated.token, authenticated.user)
      navigate(attemptedPath(location.state) ?? routes.dashboard, { replace: true })
    } catch (verificationError: unknown) {
      setError(getLoginErrorMessage(verificationError))
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  function useDifferentEmail() {
    setStep('email')
    setCode('')
    setError('')
  }

  // An expiry notice is shown until something replaces it: a real login error, or the
  // admin starting a fresh attempt.
  return {
    step,
    email,
    code,
    error: error || (sessionExpired ? SESSION_EXPIRED_MESSAGE : ''),
    loading,
    setEmail,
    setCode,
    requestCode,
    verifyCode,
    useDifferentEmail,
  }
}

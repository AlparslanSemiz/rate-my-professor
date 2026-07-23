import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../api/ApiClient'
import { authService } from '../../../api/AuthService'
import { routes } from '../../../constants/routes'
import { useAuth } from '../../../context/useAuth'
import { getDemoAdminTokenForEmail } from '../../../utils/demoAuth'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import { authenticateAdmin, getLoginErrorMessage } from '../authenticateAdmin'

export type LoginStep = 'email' | 'code'

const REQUEST_CODE_ERROR_FALLBACK = 'Could not send login code'

export function useLoginFlow() {
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function requestCode() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    setError('')
    setLoading(true)
    try {
      const demoToken = getDemoAdminTokenForEmail(trimmedEmail)
      if (!demoToken) {
        const response = await authService.requestLoginCode(trimmedEmail)
        if (!response.success) throw new Error(response.message)
      }
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

    setError('')
    setLoading(true)
    try {
      const authenticated = await authenticateAdmin(trimmedEmail, trimmedCode)
      login(authenticated.token, authenticated.user)
      navigate(routes.dashboard)
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

  return {
    step,
    email,
    code,
    error,
    loading,
    setEmail,
    setCode,
    requestCode,
    verifyCode,
    useDifferentEmail,
  }
}

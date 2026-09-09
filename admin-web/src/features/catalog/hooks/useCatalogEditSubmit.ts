import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../../utils/getErrorMessage'

interface CatalogEditSubmitOptions<TUpdate extends object> {
  id: string
  update: TUpdate
  canSave: boolean
  onClose: () => void
  onSubmit: (id: string, update: TUpdate) => Promise<void>
  errorMessage: string
}

export function useCatalogEditSubmit<TUpdate extends object>({
  id,
  update,
  canSave,
  onClose,
  onSubmit,
  errorMessage,
}: CatalogEditSubmitOptions<TUpdate>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError('')
    try {
      await onSubmit(id, update)
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, errorMessage))
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, handleSubmit }
}

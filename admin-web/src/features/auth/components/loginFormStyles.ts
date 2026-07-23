import type { CSSProperties } from 'react'
import { darkInputStyles } from '../../../constants/inputStyles'

export const submitButtonStyle: CSSProperties = { fontWeight: 600 }

export const loginInputStyles = {
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  input: { ...darkInputStyles.input, borderRadius: 8 },
}

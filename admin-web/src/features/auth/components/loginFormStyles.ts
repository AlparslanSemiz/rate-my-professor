import type { CSSProperties } from 'react'
import { chrome } from '@/theme'

export const submitButtonStyle: CSSProperties = { fontWeight: 600 }

/**
 * Only the login screen's departure from the panel's inputs: a smaller, quieter label. The
 * field itself — background, border, text colour — comes from the theme, and the tighter
 * corner is the `radius` prop on the inputs themselves rather than a hand-written
 * `borderRadius`.
 */
export const loginInputStyles = {
  label: { color: chrome.textMuted, fontSize: 13, marginBottom: 6 },
}

/** The login card's inputs sit tighter than the panel default of `md`. */
export const LOGIN_INPUT_RADIUS = 8

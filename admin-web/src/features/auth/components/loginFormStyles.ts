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

/**
 * `loginInputStyles`, plus a description slot that is announced but never drawn.
 *
 * `F-031`: a refused address is explained in the page-level alert above the form, and nothing
 * tied that sentence to the field it refuses. Mantine only sets `aria-describedby` from its own
 * wrapper - an `aria-describedby` passed to `TextInput` is overwritten - so the association has
 * to go through the description slot, and the slot has to be inaudible-only for the layout to
 * stay exactly as it was. The alert remains the visible copy.
 *
 * `clip` rather than `display: none` or `visibility: hidden`, both of which take the element out
 * of the accessibility tree and would make the association point at nothing.
 */
export const loginInputStylesWithHiddenDescription = {
  ...loginInputStyles,
  /*
   * Mantine reserves a 5px gap under the input whenever a description exists, so simply hiding
   * the description still pushed the submit button down by 5px the moment an address was
   * refused. Measured in Chromium, not assumed: the wrapper's `margin-bottom` goes 0px -> 5px.
   * It is already 0 without a description, so pinning it to 0 makes the two states identical
   * rather than overriding anything.
   */
  wrapper: { marginBottom: 0 },
  description: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
} as const

/**
 * Where the refused sentence goes: after the input, and never into the error slot.
 *
 * Leaving `'error'` out is what keeps Mantine from drawing its own copy of the message under
 * the field while still reporting `aria-invalid`.
 */
export const LOGIN_EMAIL_WRAPPER_ORDER = ['label', 'input', 'description'] as const

/** The login card's inputs sit tighter than the panel default of `md`. */
export const LOGIN_INPUT_RADIUS = 8

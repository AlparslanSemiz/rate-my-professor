import {
  AppShell,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Textarea,
  TextInput,
  type MantineThemeComponents,
} from '@mantine/core'
import { chrome } from './chrome'

/**
 * What the panel's inputs and modals look like, declared once.
 *
 * These styles used to be two exported objects — `darkInputStyles` and `darkModalStyles` —
 * handed to `styles={...}` at 42 call sites across 22 files. That worked, but it meant every
 * new input had to remember to opt in, and an input that forgot was not obviously wrong on
 * screen, just slightly paler than its neighbours. Moving them here makes the panel's look
 * the default and forgetting impossible.
 *
 * Each input component is listed separately on purpose. Mantine cascades `defaultProps` from
 * `Input` to everything built on it, but not `styles`, so theming `Input` alone would leave
 * `Select` and the rest unstyled.
 */
const inputStyles = {
  input: {
    background: chrome.surfaceSunken,
    border: `1px solid ${chrome.border}`,
    color: chrome.textPrimary,
  },
} as const

export const components: MantineThemeComponents = {
  /**
   * The authenticated shell. These were written at the call site in `AdminLayout`, which is
   * the only place an `AppShell` appears — but that made the panel's chrome a property of one
   * component rather than of the panel, and step 2 moved every other such style here.
   *
   * The navbar's wash runs from the page background down to the sunken surface, so the
   * sidebar reads as part of the page rather than as a card laid on top of it. The inset
   * highlight is a one-pixel catch of light on its right edge, not a shadow.
   */
  AppShell: AppShell.extend({
    styles: {
      main: { background: 'transparent', minHeight: '100vh' },
      navbar: {
        background: `linear-gradient(180deg, ${chrome.pageBase} 0%, ${chrome.surfaceSunken} 100%)`,
        borderRight: `1px solid ${chrome.borderSubtle}`,
        boxShadow: '1px 0 0 rgba(255,255,255,0.02) inset',
      },
    },
  }),

  TextInput: TextInput.extend({ styles: inputStyles }),
  Textarea: Textarea.extend({ styles: inputStyles }),
  Select: Select.extend({ styles: inputStyles }),
  MultiSelect: MultiSelect.extend({ styles: inputStyles }),
  NumberInput: NumberInput.extend({ styles: inputStyles }),

  Modal: Modal.extend({
    styles: {
      content: { background: chrome.surface, border: `1px solid ${chrome.border}` },
      header: { background: chrome.surface, borderBottom: `1px solid ${chrome.border}` },
      title: { color: chrome.textBright, fontWeight: 600 },
      close: { color: chrome.textDim },
    },
  }),
}

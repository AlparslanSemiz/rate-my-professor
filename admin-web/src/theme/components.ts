import {
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

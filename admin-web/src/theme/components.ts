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
/**
 * How far a text box grows before it scrolls inside itself instead.
 *
 * Twelve lines is about 260px at the panel's line height, which fits inside the shortest
 * dialog the modal shell allows (630px at a 700px viewport) with room for the controls under
 * it. Past this the field scrolls rather than the dialog, so a long value never pushes a Save
 * button out of reach.
 */
const TEXTAREA_MAX_ROWS = 12

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
  /**
   * Grows with what is typed into it, up to {@link TEXTAREA_MAX_ROWS}.
   *
   * `autosize` is the load-bearing prop, and not for the reason it sounds like. Mantine drops
   * `minRows` and `maxRows` entirely unless it is set - `Textarea.tsx` reads
   * `const autosizeProps = shouldAutosize ? { maxRows, minRows } : {}` - so the five call sites
   * that each asked for a floor of 5, 4, 3, 2 and 2 rows were all getting the browser's default
   * two, and the comment editor hid 22px of a 191-character comment mid-sentence. `F-084`.
   *
   * Declared here rather than at the five call sites because it is one decision. The floors
   * stay where they are: each field knows how much it expects to hold, and this only makes
   * those numbers take effect.
   */
  Textarea: Textarea.extend({
    styles: inputStyles,
    defaultProps: { autosize: true, maxRows: TEXTAREA_MAX_ROWS },
  }),
  /**
   * `clearButtonProps` for the same reason as `Modal`'s close button below: a clearable
   * `Select` draws an unlabelled button and a screen reader announces it as "button". Found by
   * `e2e/surfaces.spec.ts` inside the catalogue editors, where nothing had ever looked.
   */
  Select: Select.extend({
    styles: inputStyles,
    defaultProps: { clearButtonProps: { 'aria-label': 'Clear' } },
  }),
  MultiSelect: MultiSelect.extend({
    styles: inputStyles,
    defaultProps: { clearButtonProps: { 'aria-label': 'Clear' } },
  }),
  NumberInput: NumberInput.extend({ styles: inputStyles }),

  Modal: Modal.extend({
    /**
     * The close button had no accessible name, in every dialog the panel opens.
     *
     * Mantine draws an unlabelled `CloseButton` in the header unless it is given one, so a
     * screen reader announced the first control of all eleven dialogs as "button". Nothing
     * caught it: the jsdom accessibility layer scans each route as it first renders and never
     * opens a modal, which is the gap `e2e/surfaces.spec.ts` exists to close — it found this
     * on its first run.
     *
     * Set here rather than on eleven `<Modal>` elements, because it is one decision and the
     * eleventh would have been the one that got forgotten. No visual change: an accessible
     * name is not painted.
     */
    /**
     * And the dialog fades in without moving.
     *
     * Mantine's default entrance is `fade-down`, a 30px `translateY`. Measured on every
     * dialog the panel opens: the box starts 30px high and settles over four to six frames,
     * height unchanged throughout - so what an operator sees on opening a detail view is the
     * panel sliding under it. `DESIGN.md` §Motion allows **one** movement anywhere in the
     * panel, the dashboard card's `translateY(-2px)`, and says "nothing else moves, and
     * nothing moves further than this". Thirty pixels on eleven surfaces is fifteen times
     * that. `F-090`.
     *
     * `fade` keeps the entrance without the travel. Mantine honours
     * `prefers-reduced-motion` for its transitions itself, so the reduced-motion block in
     * `src/interactive.css` has nothing to add here.
     */
    defaultProps: {
      closeButtonProps: { 'aria-label': 'Close' },
      transitionProps: { transition: 'fade' },
    },
    styles: {
      content: { background: chrome.surface, border: `1px solid ${chrome.border}` },
      header: { background: chrome.surface, borderBottom: `1px solid ${chrome.border}` },
      title: { color: chrome.textBright, fontWeight: 600 },
      close: { color: chrome.textDim },
    },
  }),
}

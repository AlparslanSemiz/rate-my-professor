/**
 * The panel's neutral chrome: surfaces, borders and text greys.
 *
 * `src/constants/colors.ts` deliberately holds only *accent* colour, and says so — neutral
 * chrome is not accent, and pulling it in there would make every grey a decision. But it has
 * to live somewhere, and until now it lived nowhere: the same greys were written out as hex
 * literals in 67 files, 386 times, so changing the panel's border colour meant a search and
 * replace and hoping.
 *
 * These are those literals given the names they were already being used under. Five of them
 * were near-duplicates — `#1c2128`, `#1e2028`, `#1b1f27`, `#21262d` and `#232935` were all
 * "a hairline", within five points of each other and chosen at random by whoever wrote the
 * component. They are now two: `border` and `borderSubtle`. The same went for the four
 * near-identical raised surfaces, which are now `surface`. That is a visual change, but only
 * in the sense that two greys nobody could tell apart became one.
 * The values are deliberately *not* the `dark` and `gray` ramps in `palette.ts` — those are
 * what Mantine components draw themselves from, while these are what the panel's own
 * surfaces are painted with. Keeping them apart is why a Mantine `Badge` and a hand-built
 * table row can sit next to each other without clashing.
 */
export const chrome = {
  /** Raised surface: modals, panels, the sidebar's cards. */
  surface: '#161b22',
  /** Recessed surface: input fields, wells. */
  surfaceSunken: '#0f1117',
  /** The standard hairline between surfaces. */
  border: '#21262d',
  /** A quieter hairline, for rows inside an already-bordered surface. */
  borderSubtle: '#1c2128',
  /** The app background, and the top of the sidebar's gradient. */
  pageBase: '#12151c',
  /** The deepest recess: the before/after value blocks in an audit entry. */
  well: '#0b0d12',

  /** Headings and the strongest values in a table. */
  textBright: '#f1f5f9',
  /** Body text on a dark surface. */
  textPrimary: '#e2e8f0',
  /** Secondary values that still have to be read. */
  textSecondary: '#d1d5db',
  /** Supporting text: descriptions, meanings, timestamps. */
  textMuted: '#9ca3af',
  /** Labels and captions — the panel's most common grey by a wide margin. */
  textDim: '#6b7280',
  /** Text that is present but not meant to draw the eye. */
  textFaint: '#4b5563',
  /** Decorative icons in empty states, where the message carries the meaning. */
  iconFaint: '#374151',
} as const

export type ChromeToken = keyof typeof chrome

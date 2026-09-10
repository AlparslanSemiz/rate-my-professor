export const statGridCols = { base: 1, sm: 2, lg: 4 }
export const moduleGridCols = { base: 1, sm: 2, lg: 3 }
export const twoColumnGridCols = { base: 1, md: 2 }

/**
 * Widths for the filter controls that sit above a table.
 *
 * These were six numbers assigned by eye — 150, 160 and 180 — and the widest content had been
 * given the narrowest box: the report-reason select was `180`, and at `size="sm"` that leaves
 * roughly 130px of text once the chevron and padding are taken out. "Inappropriate content"
 * needs about 140, so the longest option in the panel was the one that truncated. A select
 * shows its value *in* the input, so there is no tooltip and no title attribute — the
 * truncated text is also what a screen reader reads back.
 *
 * Named by the content they have to hold, so the next select is sized by asking what goes in
 * it rather than by matching its neighbour.
 */
export const controlWidth = {
  /** One-word enum labels: "Active", "Hidden", "Newest first". */
  compact: 150,
  /** Two words, or a label that reads short but is not: "Action taken", "Visible". */
  medium: 160,
  /** The longest option the panel has: "Inappropriate content", at 21 characters. */
  roomy: 220,
} as const

/**
 * The search box above a table: grows with the toolbar, and stops before it turns into a
 * paragraph-shaped field nobody types that much into.
 */
export const searchFieldWidth = { flex: '1 1 240px', maxWidth: 320 } as const

/**
 * The sign-in card.
 *
 * A `max-width`, not a `width`. It was fixed at 400px inside a flex-centred page, so below a
 * 400px viewport — a small phone, or any desktop browser at 200% zoom, which WCAG 1.4.4 and
 * 1.4.10 both require to work — the card overflowed on both sides at once and the left edge
 * could not be scrolled back into view.
 */
export const LOGIN_CARD_MAX_WIDTH = 400

/**
 * The padding inside a table body cell, and so the height of a row whose content is one line.
 *
 * `F-069`: seven tables carried three different vertical values - 13px on Users, 14px on the
 * catalogue and the two logs, 16px on the moderation content and report rows - which produced
 * row heights of 51.8, 54.3, 66.1, 69.6 and 94.4px. Some of that spread is content and stays:
 * a Comments row draws a two-line excerpt and an author chip, so it is legitimately taller.
 * What was not legitimate was three paddings for one decision.
 *
 * 14px is the value the majority already used, so adopting it moves the fewest rows: Users
 * gains 2px and the two moderation tables lose 4px.
 *
 * The header has its own, smaller padding on purpose - see `TableHeaderRow`.
 */
export const tableCellPadding = '14px 20px'

/**
 * The padding around a list's empty state, and so how tall the block is.
 *
 * `F-087`: six empty states carried three paddings - `40px 20px` on Users and the catalogue,
 * `py={60}` on the two moderation tables and the bug queue, `56px 20px` on the two logs -
 * which drew the same "nothing here" message as a 101px box on one screen and a 191px box on
 * the next. 60px is the value the largest group already used.
 *
 * The icon beside the message is `iconSize.emptyState` everywhere for the same reason; the
 * logs drew theirs at 34 and recorded it as drift.
 */
export const EMPTY_STATE_PADDING = '60px 20px'

/**
 * The three field shapes a filter bar is built from, so that the same control is the same width
 * on every screen.
 *
 * `F-067`: the panel had five filter layouts, and the widths were the visible half of it. Every
 * field was written `flex: '<n> 1 <basis>'` with **no upper bound**, so a field's width was
 * decided by what happened to wrap onto its row rather than by what goes in it. Measured at
 * 1440: the Comments search was **922px** because it was `flex: 1` beside one select, and the
 * Audit Logs end date was **838.5px** against the identical control's **413.2px** on Activity
 * Logs - one flexible sibling on the wrapped row instead of two.
 *
 * A `maxWidth` is what makes that impossible. The basis still lets a field grow into a wide bar
 * and shrink on a narrow one; the bound stops it becoming a different control.
 *
 * The bases are also chosen so **Audit Logs' six controls fit one row at 1440**: 260 + 160 + 160
 * + 160 + 130 + 130 = 1000, plus five 12px gaps, is 1060 in a 1094px panel. Activity Logs has a
 * seventh control and wraps; that is recorded rather than fixed by cramping every field on every
 * screen down to the width the widest screen would need.
 */
export const filterFieldWidth = {
  /** Free-text search, and always the first control in the bar. */
  search: { flex: '2 1 260px', maxWidth: 360 },
  /** A select over a vocabulary the backend supplies: actors, actions, targets, statuses. */
  select: { flex: '1 1 160px', maxWidth: 200 },
  /** A `type="date"` box. Chromium needs about 130px before it clips its own placeholder. */
  date: { flex: '1 1 130px', maxWidth: 170 },
} as const

/**
 * The same three shapes, without the upper bound, for a bar that wraps.
 *
 * The two log bars take two control rows at **every** width from 1024 to 1440 - six and seven
 * controls against a 1094px panel - and `maxWidth` meant the last row stopped short: at 1440
 * Audit's second row held one 170px control with **923px** of empty space beside it, and
 * Activity's held two with 741px. `F-088`.
 *
 * Dropping the cap lets each wrapped row fill the width it is given. It does **not** change
 * where the rows break, because a flex line wraps on `flex-basis` and minimum size rather than
 * on the maximum - so this fills the bar without cramming the controls onto one line, which is
 * the trade `F-088` records four options for and which is not being taken tonight.
 *
 * Only the log bars use these. The four smaller bars never wrap, so removing their bound would
 * stretch two controls across 1094px, which is the unbounded growth `F-067` added the cap to
 * stop.
 */
export const wrappingFilterFieldWidth = {
  search: { flex: '2 1 260px' },
  select: { flex: '1 1 160px' },
  date: { flex: '1 1 130px' },
} as const

/** The gap between filter controls, and between the bar's control row and its action row. */
export const FILTER_BAR_GAP = 12

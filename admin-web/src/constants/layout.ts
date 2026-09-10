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


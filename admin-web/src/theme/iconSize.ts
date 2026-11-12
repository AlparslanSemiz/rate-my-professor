/**
 * The sizes an icon is drawn at, named by where it sits rather than by a t-shirt letter.
 *
 * Fifty-five icons were written with a bare number, and the same icon appeared at three
 * different sizes depending on which file it was in — `IconPencil` is 13, 14 and 15 across
 * the panel. Naming them does not make those three agree; it makes the disagreement visible
 * and gives the next person one place to reconcile it. **No pixel changed when these names
 * were introduced**, deliberately: `docs/DESIGN.md` asks for a visual pass before a style
 * change, and a find-and-replace is not one.
 *
 * Sizes outside this scale exist and are fine — a brand mark, an empty-state illustration,
 * a status dot. They are one-offs named where they are used, not scale steps.
 */
export const iconSize = {
  /** Inside a badge or a chip, set against `xs` text. */
  badge: 12,
  /** In a compact control — the buttons in a details panel, and inline status markers. */
  compact: 13,
  /** The default: input adornments, tab labels, alert icons, inline markers. */
  inline: 14,
  /** A table row's own action buttons, which sit a step above inline text. */
  rowAction: 15,
  /** The icon that fills an empty state. */
  emptyState: 32,
} as const

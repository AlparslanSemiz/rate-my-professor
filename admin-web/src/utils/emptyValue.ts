/**
 * What is drawn where a value would be, when there is no value.
 *
 * A plain hyphen. It was an em dash until 2026-09-10, and the reasoning recorded here then is
 * worth keeping because it was half right: two glyphs were in use for one meaning, `formatDate`
 * answering an unparseable date with `'-'` while every hand-written marker used `'—'`, and one
 * glyph for one meaning is still the point. What changed is which glyph, and that is now a
 * written rule rather than a preference: `docs/DESIGN.md` bans the em and en dash from
 * interface text, so the marker follows the rule instead of arguing with it.
 *
 * A missing value is not the same thing as a zero, and neither is the same as a value that
 * was never read: `formatAverageRating` and `UserCounts` both make that distinction, and both
 * end up here when the answer is "nothing to show".
 */
export const EMPTY_VALUE = '-'

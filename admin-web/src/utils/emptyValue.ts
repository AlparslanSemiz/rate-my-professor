/**
 * What is drawn where a value would be, when there is no value.
 *
 * An em dash, not a hyphen. Both were in use — `formatDate` answered an unparseable date with
 * `'-'` while every hand-written marker in the panel used `'—'` — so the same "nothing here"
 * appeared in two glyphs, one of which reads as a minus sign.
 *
 * A missing value is not the same thing as a zero, and neither is the same as a value that
 * was never read: `formatAverageRating` and `UserCounts` both make that distinction, and both
 * end up here when the answer is "nothing to show".
 */
export const EMPTY_VALUE = '—'

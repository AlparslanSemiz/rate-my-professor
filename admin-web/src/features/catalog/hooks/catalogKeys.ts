/**
 * Query keys for the catalogue.
 *
 * Its own file because three hooks share it: the two lists, the ratings page, and the writes
 * that invalidate them.
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  lectures: () => [...catalogKeys.all, 'lectures'] as const,
  professors: () => [...catalogKeys.all, 'professors'] as const,
  /** The lecture filter is part of the key, so switching it is a cache lookup, not a reload. */
  ratings: (lectureId: string | null) => [...catalogKeys.all, 'ratings', lectureId] as const,
}

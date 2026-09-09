import type { BackendRating, Rating } from './ratingTypes'

const UNKNOWN_AUTHOR = 'Unknown'

/**
 * Flattens a rating and fills in what may be missing.
 *
 * An author the backend cannot name becomes "Unknown" rather than an empty cell, and absent
 * scores become an empty map rather than `null` — the table renders a dash per category
 * either way, and the components downstream never have to test for absence.
 *
 * @param rating the rating as it arrived
 * @returns the rating as every screen reads it
 */
export function toRating(rating: BackendRating): Rating {
  return {
    id: rating.id,
    lectureId: rating.lectureId ?? null,
    authorName: rating.author?.name?.trim() || UNKNOWN_AUTHOR,
    createdAt: rating.createdAt ?? '',
    scores: rating.scores ?? {},
  }
}

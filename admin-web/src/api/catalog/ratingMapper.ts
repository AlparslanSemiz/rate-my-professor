import type { BackendRating, BackendRatingTopic, Rating } from './ratingTypes'

const UNKNOWN_AUTHOR = 'Unknown'

/**
 * The scored categories, as a map keyed by category.
 *
 * The wire carries an ordered list of `{category, value}`; the screens read a map. Built by
 * insertion so the backend's order survives - the keys are SCREAMING_SNAKE, never
 * integer-like, so JavaScript preserves it - and an entry missing either half is dropped
 * rather than written as `undefined`, which would render as a category scored "-".
 *
 * @param topics whatever arrived under `topics`
 * @returns category to score
 */
function toScores(topics: BackendRatingTopic[] | null | undefined): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const topic of topics ?? []) {
    if (typeof topic?.category === 'string' && typeof topic.value === 'number') {
      scores[topic.category] = topic.value
    }
  }
  return scores
}

/**
 * Flattens a rating and fills in what may be missing.
 *
 * A student the backend cannot name becomes "Unknown" rather than an empty cell, and absent
 * topics become an empty map rather than `null` — the table renders a dash either way, and
 * the components downstream never have to test for absence.
 *
 * @param rating the rating as it arrived
 * @returns the rating as every screen reads it
 */
export function toRating(rating: BackendRating): Rating {
  return {
    id: rating.id,
    lectureId: rating.lectureId ?? null,
    authorName: rating.student?.name?.trim() || UNKNOWN_AUTHOR,
    createdAt: rating.createdAt ?? '',
    scores: toScores(rating.topics),
  }
}

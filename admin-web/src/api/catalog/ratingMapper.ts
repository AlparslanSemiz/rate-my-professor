import type { BackendRating, Rating } from './ratingTypes'

const UNKNOWN_AUTHOR = 'Unknown'

export function toRating(rating: BackendRating): Rating {
  return {
    id: rating.id,
    lectureId: rating.lectureId ?? null,
    authorName: rating.author?.name?.trim() || UNKNOWN_AUTHOR,
    createdAt: rating.createdAt ?? '',
    scores: rating.scores ?? {},
  }
}

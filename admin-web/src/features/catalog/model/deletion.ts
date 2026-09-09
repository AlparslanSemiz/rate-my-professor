import type { Lecture, Professor, Rating } from '@/api/catalog'
import { lectureLabel, professorName } from './catalog'

/**
 * What is about to be deleted. The page holds one of these rather than three separate
 * `useState<T | null>` slots, so there is one confirmation dialog instead of three that
 * differ only in their wording.
 */
export type CatalogDeletion =
  | { type: 'lecture'; record: Lecture }
  | { type: 'professor'; record: Professor }
  | { type: 'rating'; record: Rating }

export interface CatalogDeletionCopy {
  title: string
  description: string
  confirmLabel: string
}

/**
 * What each deletion actually takes with it. The three differ in more than the noun — a
 * lecture takes its comments, answers and ratings, a professor takes only the assignment,
 * and a rating is someone's own assessment — so the wording is the point, not boilerplate.
 */
export function getCatalogDeletion(deletion: CatalogDeletion): CatalogDeletionCopy {
  switch (deletion.type) {
    case 'lecture':
      return {
        title: 'Delete lecture',
        description: `Delete ${lectureLabel(deletion.record)}? Its comments, answers and ratings go with it. This cannot be undone.`,
        confirmLabel: 'Delete lecture',
      }
    case 'professor':
      return {
        title: 'Delete professor',
        description: `Delete ${professorName(deletion.record)}? The lectures stay — only the assignment is dropped.`,
        confirmLabel: 'Delete professor',
      }
    case 'rating':
      return {
        title: 'Delete rating',
        description: `Remove this rating by ${deletion.record.authorName}? A rating is someone's own assessment, so this cannot be undone.`,
        confirmLabel: 'Delete rating',
      }
  }
}

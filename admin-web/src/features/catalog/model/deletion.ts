import type { Lecture, Professor, Rating } from '@/api/catalog'
import { assertNever } from '@/utils/assert'
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

/** What the confirmation dialog says and does for one kind of catalogue deletion. */
export interface CatalogDeletionCopy {
  title: string
  description: string
  confirmLabel: string
  /** The call that actually deletes it, already bound to the record. */
  remove: () => Promise<void>
}

/**
 * The three deletions the catalogue can perform, supplied by the page that owns the services.
 *
 * The model chooses *which* one runs; it does not know how any of them is done.
 */
export interface CatalogDeleters {
  lecture: (id: string) => Promise<void>
  professor: (id: string) => Promise<void>
  rating: (id: string) => Promise<void>
}

/**
 * What a deletion says, and what it does.
 *
 * The three differ in more than the noun — a lecture takes its comments, answers and ratings
 * with it, a professor takes only the assignment, and a rating is someone's own assessment —
 * so the wording is the point, not boilerplate.
 *
 * The **call** is chosen here too, alongside the wording. It used to be picked a second time
 * by an if-chain in `CatalogPage`, over the same discriminant, with no exhaustive check: a
 * fourth kind of deletion would have got its own correct wording from this function and then
 * fallen through that chain's final `return` into deleting a *rating*. One dispatch means the
 * two cannot disagree, and the `default` below means a fourth kind fails to compile.
 *
 * @param deletion what is about to be deleted
 * @param deleters how to delete each kind, supplied by the page
 * @returns the dialog's wording, with the deletion bound to the record
 */
export function getCatalogDeletion(
  deletion: CatalogDeletion,
  deleters: CatalogDeleters,
): CatalogDeletionCopy {
  switch (deletion.type) {
    case 'lecture':
      return {
        title: 'Delete lecture',
        description: `Delete ${lectureLabel(deletion.record)}? Its comments, answers and ratings go with it. This cannot be undone.`,
        confirmLabel: 'Delete lecture',
        remove: () => deleters.lecture(deletion.record.id),
      }
    case 'professor':
      return {
        title: 'Delete professor',
        description: `Delete ${professorName(deletion.record)}? The lectures stay; only the assignment is dropped.`,
        confirmLabel: 'Delete professor',
        remove: () => deleters.professor(deletion.record.id),
      }
    case 'rating':
      return {
        title: 'Delete rating',
        description: `Remove this rating by ${deletion.record.authorName}? A rating is someone's own assessment, so this cannot be undone.`,
        confirmLabel: 'Delete rating',
        remove: () => deleters.rating(deletion.record.id),
      }
    default:
      // Unreachable while the union is exhaustive; the value of the branch is that adding a
      // fourth kind of deletion fails to compile here instead of quietly getting no wording.
      return assertNever(deletion, 'catalogue deletion')
  }
}

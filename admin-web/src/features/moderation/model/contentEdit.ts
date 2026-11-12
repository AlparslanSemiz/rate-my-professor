import type { ContentUpdate } from '@/api/moderation'
import type { EditableContentStatus } from '@/domain/moderation'
import type { ModeratedItem } from './content'

/** The edit modal's working copy of a comment or an answer. */
export interface ContentEditDraft {
  content: string
  status: EditableContentStatus
}

/** A `DELETED` item cannot be put back to a visibility, so editing starts from `HIDDEN`. */
export function toEditableStatus(item: ModeratedItem): EditableContentStatus {
  return item.status === 'VISIBLE' ? 'VISIBLE' : 'HIDDEN'
}

/**
 * @param item the comment or answer being edited
 * @returns the draft the form works on
 */
export function createContentEditDraft(item: ModeratedItem): ContentEditDraft {
  return {
    content: item.content,
    status: toEditableStatus(item),
  }
}

/**
 * @param item the item as it stands
 * @param draft the form's working copy
 * @returns only the changed fields; possibly empty, which the caller must not send
 */
export function buildContentUpdate(
  item: ModeratedItem,
  draft: ContentEditDraft,
): ContentUpdate {
  const trimmedContent = draft.content.trim()
  const update: ContentUpdate = {}

  if (trimmedContent !== item.content) update.content = trimmedContent
  if (draft.status !== toEditableStatus(item)) update.status = draft.status

  return update
}

/** @returns whether Save should be offered: something changed, and the text is not blank. */
export function canSaveContentEdit(item: ModeratedItem, draft: ContentEditDraft) {
  return draft.content.trim().length > 0 && Object.keys(buildContentUpdate(item, draft)).length > 0
}

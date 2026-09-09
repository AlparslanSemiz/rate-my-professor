import type { ContentUpdate } from '../../../api/CommentsService'
import type { EditableContentStatus } from '../../../domain/moderation'
import type { ModeratedItem } from './content'

export interface ContentEditDraft {
  content: string
  status: EditableContentStatus
}

/** A `DELETED` item cannot be put back to a visibility, so editing starts from `HIDDEN`. */
export function toEditableStatus(item: ModeratedItem): EditableContentStatus {
  return item.status === 'VISIBLE' ? 'VISIBLE' : 'HIDDEN'
}

export function createContentEditDraft(item: ModeratedItem): ContentEditDraft {
  return {
    content: item.content,
    status: toEditableStatus(item),
  }
}

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

export function canSaveContentEdit(item: ModeratedItem, draft: ContentEditDraft) {
  return draft.content.trim().length > 0 && Object.keys(buildContentUpdate(item, draft)).length > 0
}

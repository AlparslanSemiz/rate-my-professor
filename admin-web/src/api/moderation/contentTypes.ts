import type { EditableContentStatus } from '@/domain/moderation'

/** Partial edit of moderated content. An omitted field is left alone; at least one has to be supplied. */
export interface ContentUpdate {
  content?: string
  status?: EditableContentStatus
}

import type { EditableContentStatus } from '../domain/moderation'

export interface ContentUpdate {
  content?: string
  status?: EditableContentStatus
}

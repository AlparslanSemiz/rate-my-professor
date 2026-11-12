import { apiClient, type HttpTransport } from '@/api/client/ApiClient'
import { ModerationService } from './ModerationService'
import type { ManagedComment, ReportedComment } from './commentTypes'

export type { ContentUpdate } from './contentTypes'
export type {
  CommentReportStatus,
  CommentUserRef,
  ManagedComment,
  ReportedComment,
  ReportReason,
  UserRole,
  UserStatus,
} from './commentTypes'

/**
 * Comments and the reports against them.
 *
 * Deleting a comment takes the thread of answers under it with it — the backend cascades,
 * and this is the one place the two resources genuinely differ in what an operation means.
 */
export class CommentsService extends ModerationService<ManagedComment, ReportedComment> {
  constructor(client: HttpTransport) {
    super(client, 'comments')
  }
}

/** The panel's comments service, bound to the shared client. */
export const commentsService = new CommentsService(apiClient)

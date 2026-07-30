import { commentsService } from '../../api/CommentsService'
import ModerationPage from '../moderation/ModerationPage'
import type { ModerationApi } from '../moderation/hooks/useModerationPage'
import { toCommentReport, toModeratedComment } from '../moderation/moderationModel'

const commentsApi: ModerationApi = {
  loadContent: async () => (await commentsService.getAll()).map(toModeratedComment),
  loadReports: async () => (await commentsService.getReported()).map(toCommentReport),
  updateContent: (id, update) => commentsService.update(id, update),
  deleteContent: (id) => commentsService.delete(id),
  updateReportStatus: (id, status) => commentsService.updateStatus(id, status),
  deleteReport: (id) => commentsService.deleteReport(id),
}

export default function CommentsPage() {
  return (
    <ModerationPage
      title="Comments"
      description="Every comment in the app, plus the ones your community flagged. Tap a name to open their profile."
      noun="comment"
      api={commentsApi}
      contentErrorMessage="Failed to load comments"
      reportsErrorMessage="Failed to load reported comments"
    />
  )
}

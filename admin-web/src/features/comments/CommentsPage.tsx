import { answersService } from '../../api/AnswersService'
import { commentsService } from '../../api/CommentsService'
import ModerationPage from '../moderation/ModerationPage'
import type { ModerationApi } from '../moderation/hooks/useModerationPage'
import { attachReplies, toAnswerReport, toCommentReport } from '../moderation/moderationModel'

/**
 * Answers are replies to a comment, not a separate top-level feed, so they are fetched here
 * too and nested under their comment instead of living on their own page. A mutation is routed
 * to the comment or the answer service by `item.kind`, since both are edited from this one screen.
 */
const commentsApi: ModerationApi = {
  loadContent: async () => {
    const [comments, answers] = await Promise.all([commentsService.getAll(), answersService.getAll()])
    return attachReplies(comments, answers)
  },
  loadReports: async () => {
    const [commentReports, answerReports] = await Promise.all([
      commentsService.getReported(),
      answersService.getReported(),
    ])
    return [...commentReports.map(toCommentReport), ...answerReports.map(toAnswerReport)]
  },
  updateContent: (item, update) =>
    item.kind === 'answer' ? answersService.update(item.id, update) : commentsService.update(item.id, update),
  deleteContent: (item) =>
    item.kind === 'answer' ? answersService.delete(item.id) : commentsService.delete(item.id),
  updateReportStatus: (report, status) =>
    report.kind === 'answer'
      ? answersService.updateStatus(report.id, status)
      : commentsService.updateStatus(report.id, status),
  deleteReport: (report) =>
    report.kind === 'answer' ? answersService.deleteReport(report.id) : commentsService.deleteReport(report.id),
}

export default function CommentsPage() {
  return (
    <ModerationPage
      title="Comments"
      description="Every comment in the app, with its answers nested underneath, plus everything your community flagged. Tap a name to open their profile."
      noun="comment"
      api={commentsApi}
      contentErrorMessage="Failed to load comments"
      reportsErrorMessage="Failed to load reported comments"
    />
  )
}

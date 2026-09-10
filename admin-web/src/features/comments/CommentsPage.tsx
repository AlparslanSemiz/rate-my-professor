import { answersService, commentsService } from '@/api/moderation'
import ModerationPage from '@/features/moderation/ModerationPage'
import type { ModerationApi } from '@/features/moderation/hooks/useModerationPage'
import { attachReplies, toAnswerReport, toCommentReport } from '@/features/moderation/model'

/**
 * Which service moderates which kind of content.
 *
 * The routing rule — comments to one service, answers to the other — was written out as a
 * ternary four times, once per mutation, over the same discriminant. Four copies of one
 * decision, and adding a third kind of content would have meant finding all four. `kind` is
 * the key, so the table *is* the rule.
 */
const CONTENT_SERVICES = {
  comment: commentsService,
  answer: answersService,
} as const

/**
 * Answers are replies to a comment, not a separate top-level feed, so they are fetched here
 * too and nested under their comment instead of living on their own page. Both are edited from
 * this one screen, and each mutation is routed by `kind` through {@link CONTENT_SERVICES}.
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
  updateContent: (item, update) => CONTENT_SERVICES[item.kind].update(item.id, update),
  deleteContent: (item) => CONTENT_SERVICES[item.kind].delete(item.id),
  updateReportStatus: (report, status) =>
    CONTENT_SERVICES[report.kind].updateStatus(report.id, status),
  deleteReport: (report) => CONTENT_SERVICES[report.kind].deleteReport(report.id),
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

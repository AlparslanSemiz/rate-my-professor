import { answersService } from '../../api/AnswersService'
import ModerationPage from '../moderation/ModerationPage'
import type { ModerationApi } from '../moderation/hooks/useModerationPage'
import { toAnswerReport, toModeratedAnswer } from '../moderation/moderationModel'

const answersApi: ModerationApi = {
  loadContent: async () => (await answersService.getAll()).map(toModeratedAnswer),
  loadReports: async () => (await answersService.getReported()).map(toAnswerReport),
  updateContent: (id, update) => answersService.update(id, update),
  deleteContent: (id) => answersService.delete(id),
  updateReportStatus: (id, status) => answersService.updateStatus(id, status),
  deleteReport: (id) => answersService.deleteReport(id),
}

export default function AnswersPage() {
  return (
    <ModerationPage
      title="Answers"
      description="Replies posted under comments, and the ones your community flagged. Tap a name to open their profile."
      noun="answer"
      api={answersApi}
      contentErrorMessage="Failed to load answers"
      reportsErrorMessage="Failed to load reported answers"
    />
  )
}

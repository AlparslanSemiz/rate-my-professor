import { apiClient, type HttpTransport } from '@/api/client/ApiClient'
import { ModerationService } from './ModerationService'
import type { ManagedAnswer, ReportedAnswer } from './answerTypes'

export type { AnswerReportStatus, ManagedAnswer, ReportedAnswer } from './answerTypes'
export type { ContentUpdate } from './contentTypes'

/**
 * Answers and the reports against them. Answers are replies to a comment rather than a feed
 * of their own, which is why they are worked from the Comments screen; deleting one removes
 * only that answer.
 */
export class AnswersService extends ModerationService<ManagedAnswer, ReportedAnswer> {
  constructor(client: HttpTransport) {
    super(client, 'answers')
  }
}

/** The panel's answers service, bound to the shared client. */
export const answersService = new AnswersService(apiClient)

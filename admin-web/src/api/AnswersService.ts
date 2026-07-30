import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import type { ContentUpdate } from './CommentsService'
import type { UserReference } from '../domain/user'
import type { ContentStatus, ReportReason, ReportStatus } from '../domain/moderation'

export type AnswerReportStatus = ReportStatus
export type { ContentUpdate }

/**
 * An answer as the panel manages it. `commentPreview` is enough of the parent comment to
 * recognise the thread; `postContext` is the lecture it belongs to.
 */
export interface ManagedAnswer {
  id: string
  content: string
  status: ContentStatus
  author: UserReference
  commentId: string
  commentPreview: string
  postContext: string
  reports: number
  createdAt: string
}

/** A report against an answer. Mirrors a comment report, with the parent comment as context. */
export interface ReportedAnswer {
  id: string
  answerContent: string
  commentContent: string
  postContext: string
  reportText: string
  reportedUser: UserReference
  reporter: UserReference
  reason: ReportReason
  status: AnswerReportStatus
  date: string
}

interface ManagedAnswersResponse extends BasicResponse {
  answers: ManagedAnswer[]
}

interface ReportedAnswersResponse extends BasicResponse {
  answers: ReportedAnswer[]
}

export class AnswersService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<ManagedAnswer[]> {
    const response = await this.client.get<ManagedAnswersResponse>('/answers')
    return response.answers
  }

  async getReported(): Promise<ReportedAnswer[]> {
    const response = await this.client.get<ReportedAnswersResponse>('/answers/reported')
    return response.answers
  }

  /** Edits the text or the visibility of an answer, independently of any report. */
  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/answers/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/answers/${id}`)
  }

  /** `ACTION_TAKEN` hides the answer; any other status puts it back. */
  updateStatus(id: string, status: AnswerReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/answers/reported/${id}`, { status })
  }

  /** Withdraws the report. The answer itself is left as it is. */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/answers/reported/${id}`)
  }
}

export const answersService = new AnswersService(apiClient)

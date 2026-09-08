import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { AnswerContentService } from './AnswerContentService'
import { AnswerReportsService } from './AnswerReportsService'
import type { AnswerReportStatus, ManagedAnswer, ReportedAnswer } from './answerTypes'
import type { ContentUpdate } from './contentTypes'

export type { AnswerReportStatus, ManagedAnswer, ReportedAnswer } from './answerTypes'
export type { ContentUpdate } from './contentTypes'

export class AnswersService {
  private readonly content: AnswerContentService
  private readonly reports: AnswerReportsService

  constructor(client: ApiClient) {
    this.content = new AnswerContentService(client)
    this.reports = new AnswerReportsService(client)
  }

  async getAll(): Promise<ManagedAnswer[]> {
    return this.content.getAll()
  }

  async getReported(): Promise<ReportedAnswer[]> {
    return this.reports.getReported()
  }

  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.content.update(id, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.content.delete(id)
  }

  updateStatus(id: string, status: AnswerReportStatus): Promise<BasicResponse> {
    return this.reports.updateStatus(id, status)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.reports.deleteReport(id)
  }
}

export const answersService = new AnswersService(apiClient)

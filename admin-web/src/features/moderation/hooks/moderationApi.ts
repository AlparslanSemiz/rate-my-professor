import type { BasicResponse } from '@/api/client'
import type { ContentUpdate } from '@/api/moderation'
import type { ReportStatus } from '@/domain/moderation'
import type { ContentRef, ModeratedItem, ReportItem } from '../model'

/**
 * The calls a moderation page makes. Comments and answers expose the same operations under
 * different paths, so the page supplies them and the shared moderation flow stays generic.
 */
export interface ModerationApi {
  loadContent: () => Promise<ModeratedItem[]>
  loadReports: () => Promise<ReportItem[]>
  updateContent: (item: ContentRef, update: ContentUpdate) => Promise<BasicResponse>
  deleteContent: (item: ContentRef) => Promise<BasicResponse>
  updateReportStatus: (report: ReportItem, status: ReportStatus) => Promise<BasicResponse>
  deleteReport: (report: ReportItem) => Promise<BasicResponse>
}

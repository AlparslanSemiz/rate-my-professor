import { useCallback } from 'react'
import { useSelectedId } from '@/hooks/useSelectedId'
import { findContent, type ReportItem } from '../model'
import type { ModerationApi } from './moderationApi'
import { useModerationActions } from './useModerationActions'
import { useModerationContent } from './useModerationContent'
import { useModerationReports } from './useModerationReports'

export type { ModerationApi } from './moderationApi'

interface ModerationPageOptions {
  api: ModerationApi
  /** Names the cache entry, so comments and answers do not share one. */
  resource: string
  contentErrorMessage: string
  reportsErrorMessage: string
}

/**
 * Composes the three halves of a moderation screen — the content, the reports against it, and
 * the writes either tab can make — and returns them grouped rather than flattened.
 *
 * It used to return twenty-four fields, which the page then spread across two tabs by hand.
 * Returning `content`, `reports` and `actions` means each tab takes the one it needs.
 */
export function useModerationPage({
  api,
  resource,
  contentErrorMessage,
  reportsErrorMessage,
}: ModerationPageOptions) {
  const content = useModerationContent({ api, resource, errorMessage: contentErrorMessage })
  const reports = useModerationReports({ api, resource, errorMessage: reportsErrorMessage })
  const actions = useModerationActions({ api, resource })
  const profile = useSelectedId()

  /**
   * The content a report is about. Both lists are loaded, so the reports tab acts on the real
   * comment — with its real visibility — instead of on a guess assembled from the report.
   */
  const contentFor = useCallback(
    (report: ReportItem) => findContent(content.items, { id: report.contentId, kind: report.kind }),
    [content.items],
  )

  return {
    content,
    reports,
    actions,
    profile,
    contentFor,
    loading: content.loading || reports.loading,
    loadError: content.error || reports.error,
    retry: () => {
      content.retry()
      reports.retry()
    },
  }
}

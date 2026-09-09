import type { BugReport, BugReportUpdate } from '@/api/feedback'

/** The bug-report edit form's working copy. */
export interface BugReportEditDraft {
  title: string
  description: string
}

/**
 * @param report the report to edit
 * @returns the draft the form works on
 */
export function createBugReportEditDraft(report: BugReport): BugReportEditDraft {
  return { title: report.title, description: report.description }
}

/**
 * Only the fields that actually changed. The backend rejects an empty body, and sending a
 * field back unchanged would record an edit nobody made — the same contract the catalogue and
 * user edit models are written to.
 */
export function buildBugReportUpdate(
  report: BugReport,
  draft: BugReportEditDraft,
): BugReportUpdate {
  const trimmedTitle = draft.title.trim()
  const trimmedDescription = draft.description.trim()
  const update: BugReportUpdate = {}

  if (trimmedTitle !== report.title) update.title = trimmedTitle
  if (trimmedDescription !== report.description) update.description = trimmedDescription

  return update
}

/**
 * A title is what the report is found by, so it may not be emptied. A description may:
 * clearing a description that was noise is a legitimate edit.
 */
export function canSaveBugReportEdit(report: BugReport, draft: BugReportEditDraft): boolean {
  return (
    draft.title.trim().length > 0 &&
    Object.keys(buildBugReportUpdate(report, draft)).length > 0
  )
}

import { http } from 'msw'
import type { ContentStatus, ReportStatus } from '@/domain/moderation'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { failure, ok, refused } from '../envelope'

/**
 * `/comments` and `/answers`, which are the same six endpoints under a different noun — the
 * shape `ModerationService<TItem, TReport>` exists for. The response key is the resource
 * name, as the backend serves it and as `expectArray` looks for it.
 */

const NOT_FOUND_MESSAGE = 'No such record'

interface Content {
  id: string
  content: string
  status: ContentStatus
}

interface Report {
  id: string
  status: ReportStatus
}

/**
 * The behaviour that is documented as a decision rather than implemented in one place: moving
 * a report to `ACTION_TAKEN` hides the content it is about, and moving it to anything else
 * puts the content back. A handler that only recorded the report's status would let a test
 * claim this works without anything having happened to the content.
 */
function applyReportStatus(status: ReportStatus, content: Content | undefined): void {
  if (!content) return
  content.status = status === 'ACTION_TAKEN' ? 'HIDDEN' : 'VISIBLE'
}

function contentHandlers<T extends Content>(resource: string, items: () => T[]) {
  return [
    http.get(apiUrl(`/${resource}`), () => ok({ [resource]: items() })),

    http.patch(apiUrl(`/${resource}/:id`), async ({ params, request }) => {
      const item = items().find((candidate) => candidate.id === params.id)
      if (!item) return failure(404, NOT_FOUND_MESSAGE)

      const update = (await request.json()) as Partial<Content>
      if (update.content !== undefined) item.content = update.content
      if (update.status !== undefined) item.status = update.status
      return ok({}, 'Updated')
    }),

    http.delete(apiUrl(`/${resource}/:id`), ({ params }) => {
      const list = items()
      const index = list.findIndex((candidate) => candidate.id === params.id)
      if (index === -1) return failure(404, NOT_FOUND_MESSAGE)
      list.splice(index, 1)
      return ok({}, 'Deleted')
    }),
  ]
}

function reportHandlers<T extends Report>(
  resource: string,
  reports: () => T[],
  contentFor: (report: T) => Content | undefined,
) {
  return [
    http.get(apiUrl(`/${resource}/reported`), () => ok({ [resource]: reports() })),

    http.patch(apiUrl(`/${resource}/reported/:id`), async ({ params, request }) => {
      const report = reports().find((candidate) => candidate.id === params.id)
      if (!report) return failure(404, NOT_FOUND_MESSAGE)

      const { status } = (await request.json()) as { status: ReportStatus }
      report.status = status
      applyReportStatus(status, contentFor(report))
      return ok({}, 'Updated')
    }),

    http.delete(apiUrl(`/${resource}/reported/:id`), ({ params }) => {
      const list = reports()
      const index = list.findIndex((candidate) => candidate.id === params.id)
      if (index === -1) return failure(404, NOT_FOUND_MESSAGE)
      // Withdrawing a report leaves the content exactly as it is. Saying otherwise here would
      // let a test assert a restore the backend does not perform.
      list.splice(index, 1)
      return ok({}, 'Deleted')
    }),
  ]
}

export const moderationHandlers = [
  ...contentHandlers('comments', () => db.comments),
  ...contentHandlers('answers', () => db.answers),
  ...reportHandlers('comments', () => db.commentReports, (report) =>
    db.comments.find((comment) => comment.id === report.commentId),
  ),
  ...reportHandlers('answers', () => db.answerReports, (report) =>
    db.answers.find((answer) => answer.id === report.answerId),
  ),
]

/** A refusal the backend serves as a 2xx, for the tests that need one. */
export function refuseNextDelete(resource: string, message: string) {
  return http.delete(apiUrl(`/${resource}/:id`), () => refused(message), { once: true })
}

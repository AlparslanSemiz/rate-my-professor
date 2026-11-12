import { http } from 'msw'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { failure, ok } from '../envelope'

/**
 * `/reports`, and the GitLab escalation that may not be configured at all.
 *
 * `gitlabEnabled` rides along on the list response because that is where the backend puts it,
 * and it decides whether the escalation control is offered: with the integration unconfigured
 * the endpoint answers `503`, so the control is hidden on the flag rather than discovered by
 * pressing it.
 */

const GITLAB_NOT_CONFIGURED = 'GitLab integration is not configured'

export const feedbackHandlers = [
  http.get(apiUrl('/reports'), () =>
    ok({ bugReports: db.bugReports, gitlabEnabled: db.gitlabEnabled }),
  ),

  http.patch(apiUrl('/reports/:id'), async ({ params, request }) => {
    const report = db.bugReports.find((candidate) => candidate.id === params.id)
    if (!report) return failure(404, 'No such report')

    const update = (await request.json()) as BugReportUpdate
    Object.assign(report, update)
    return ok({}, 'Updated')
  }),

  http.delete(apiUrl('/reports/:id'), ({ params }) => {
    const index = db.bugReports.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return failure(404, 'No such report')
    db.bugReports.splice(index, 1)
    return ok({}, 'Deleted')
  }),

  http.post(apiUrl('/reports/:id/gitlab-issue'), ({ params }) => {
    if (!db.gitlabEnabled) return failure(503, GITLAB_NOT_CONFIGURED)

    const report = db.bugReports.find((candidate) => candidate.id === params.id)
    if (!report) return failure(404, 'No such report')

    const issueUrl = `https://gitlab.kit.edu/kit/rate-my-professor/-/issues/${report.id}`
    report.issueUrl = issueUrl
    report.issueState = 'CREATED'
    return ok({ issueUrl, issueState: 'CREATED' satisfies BugReport['issueState'] })
  }),
]

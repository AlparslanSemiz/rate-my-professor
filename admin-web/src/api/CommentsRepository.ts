export type CommentReportStatus = 'Pending' | 'Reviewed' | 'Dismissed' | 'Removed'
export type ReportReason = 'Spam' | 'Harassment' | 'Hate Speech' | 'Misinformation' | 'Inappropriate' | 'Other'

export interface CommentUserRef {
  id: number
  name: string
  role: 'Admin' | 'Student' | 'Professor'
  warningCount: number
  status: 'Active' | 'Inactive' | 'Blocked'
}

export interface ReportedComment {
  id: number
  commentText: string
  postContext: string
  reportMessage: string
  reportedUser: CommentUserRef
  reportingUser: CommentUserRef
  reason: ReportReason
  status: CommentReportStatus
  reportedAt: string
}

const INITIAL_REPORTED_COMMENTS: ReportedComment[] = [
  {
    id: 1,
    commentText: 'You are absolutely terrible at this, give up already.',
    postContext: 'Best practices for code review',
    reportMessage: 'This user has been consistently attacking others in this thread. Very hostile.',
    reportedUser: { id: 3, name: 'Carol White', role: 'Student', warningCount: 1, status: 'Active' },
    reportingUser: { id: 2, name: 'Bob Johnson', role: 'Professor', warningCount: 0, status: 'Active' },
    reason: 'Harassment',
    status: 'Pending',
    reportedAt: '2026-06-03T16:22:00Z',
  },
  {
    id: 2,
    commentText: 'Buy cheap crypto NOW!!! 10000x guaranteed returns, click link in bio.',
    postContext: 'Investment strategies discussion',
    reportMessage: 'Obvious spam link. This user has been posting this same message in multiple threads.',
    reportedUser: { id: 4, name: 'David Brown', role: 'Student', warningCount: 3, status: 'Blocked' },
    reportingUser: { id: 1, name: 'Alice Smith', role: 'Admin', warningCount: 0, status: 'Active' },
    reason: 'Spam',
    status: 'Removed',
    reportedAt: '2026-06-03T13:05:00Z',
  },
  {
    id: 3,
    commentText: 'People from that country are all lazy and stupid.',
    postContext: 'Remote work culture differences',
    reportMessage: 'Very offensive, should be removed immediately. This is clearly hate speech targeting a nationality.',
    reportedUser: { id: 5, name: 'Emma Davis', role: 'Student', warningCount: 2, status: 'Active' },
    reportingUser: { id: 2, name: 'Bob Johnson', role: 'Professor', warningCount: 0, status: 'Active' },
    reason: 'Hate Speech',
    status: 'Reviewed',
    reportedAt: '2026-06-02T11:41:00Z',
  },
  {
    id: 4,
    commentText: 'This is 100% proven that vaccines cause autism, do your research!',
    postContext: 'Healthcare in 2026',
    reportMessage: 'Spreading dangerous medical misinformation. Could cause real harm to readers.',
    reportedUser: { id: 7, name: 'Grace Lee', role: 'Student', warningCount: 0, status: 'Inactive' },
    reportingUser: { id: 6, name: 'Frank Miller', role: 'Professor', warningCount: 0, status: 'Active' },
    reason: 'Misinformation',
    status: 'Pending',
    reportedAt: '2026-06-02T18:30:00Z',
  },
]

/** In-memory store for reported comments, used when no backend is configured. */
export class CommentsRepository {
  private reportedComments: ReportedComment[] = [...INITIAL_REPORTED_COMMENTS]

  getAll(): ReportedComment[] {
    return this.reportedComments.map(copyReportedComment)
  }

  setStatus(id: number, status: CommentReportStatus): void {
    if (!this.reportedComments.some((report) => report.id === id)) {
      throw new Error(`Comment report with id ${id} not found`)
    }

    this.reportedComments = this.reportedComments.map((r) =>
      r.id === id ? { ...r, status } : r
    )
  }
}

function copyUserRef(user: CommentUserRef): CommentUserRef {
  return { ...user }
}

function copyReportedComment(report: ReportedComment): ReportedComment {
  return {
    ...report,
    reportedUser: copyUserRef(report.reportedUser),
    reportingUser: copyUserRef(report.reportingUser),
  }
}

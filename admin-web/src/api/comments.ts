export type CommentReportStatus = 'Pending' | 'Reviewed' | 'Dismissed' | 'Removed'
export type ReportReason = 'Spam' | 'Harassment' | 'Hate Speech' | 'Misinformation' | 'Inappropriate' | 'Other'

export interface ReportedComment {
  id: number
  commentText: string
  commentAuthor: string
  commentAuthorId: number
  reportedBy: string
  reportedById: number
  reason: ReportReason
  additionalNote: string
  reportedAt: string
  status: CommentReportStatus
  postContext: string
}

const MOCK_REPORTED_COMMENTS: ReportedComment[] = [
  {
    id: 1,
    commentText: 'You are absolutely terrible at this, give up already.',
    commentAuthor: 'user_john99',
    commentAuthorId: 12,
    reportedBy: 'sarah_dev',
    reportedById: 7,
    reason: 'Harassment',
    additionalNote: 'This user has been targeting me across multiple posts.',
    reportedAt: '2026-06-03T14:22:00Z',
    status: 'Pending',
    postContext: 'Best practices for code review',
  },
  {
    id: 2,
    commentText: 'Buy cheap crypto NOW!!! 10000x guaranteed returns, click link in bio.',
    commentAuthor: 'crypto_king_2024',
    commentAuthorId: 45,
    reportedBy: 'mike_admin',
    reportedById: 3,
    reason: 'Spam',
    additionalNote: '',
    reportedAt: '2026-06-03T11:05:00Z',
    status: 'Removed',
    postContext: 'Investment strategies discussion',
  },
  {
    id: 3,
    commentText: 'People from that country are all lazy and stupid.',
    commentAuthor: 'anon_user_x',
    commentAuthorId: 88,
    reportedBy: 'sarah_dev',
    reportedById: 7,
    reason: 'Hate Speech',
    additionalNote: 'Very offensive, should be removed immediately.',
    reportedAt: '2026-06-02T09:41:00Z',
    status: 'Reviewed',
    postContext: 'Remote work culture differences',
  },
  {
    id: 4,
    commentText: 'This is 100% proven that vaccines cause autism, do your research!',
    commentAuthor: 'truth_seeker42',
    commentAuthorId: 61,
    reportedBy: 'doc_rahman',
    reportedById: 19,
    reason: 'Misinformation',
    additionalNote: 'Spreading dangerous health misinformation.',
    reportedAt: '2026-06-02T16:30:00Z',
    status: 'Pending',
    postContext: 'Healthcare in 2026',
  },
]

export async function getReportedComments(): Promise<ReportedComment[]> {
  await new Promise((r) => setTimeout(r, 400))
  return [...MOCK_REPORTED_COMMENTS]
}

export async function updateCommentReportStatus(
  id: number,
  status: CommentReportStatus
): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
  const report = MOCK_REPORTED_COMMENTS.find((r) => r.id === id)
  if (report) report.status = status
}

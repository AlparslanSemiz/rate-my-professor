import { describe, expect, it } from 'vitest'
import { type ManagedAnswer, type ReportedAnswer, type ManagedComment, type ReportedComment } from '@/api/moderation'
import type { UserReference } from '@/domain/user'
import {
  attachReplies,
  buildContentUpdate,
  canSaveContentEdit,
  createContentEditDraft,
  findContent,
  matchesReportFilters,
  narrowContent,
  toEditableStatus,
  toAnswerReport,
  toCommentReport,
} from './index'

const alice: UserReference = {
  id: 'user-1',
  name: 'Alice Smith',
  role: 'STUDENT',
  warnings: 1,
  status: 'ACTIVE',
}

const bob: UserReference = {
  id: 'user-2',
  name: 'Bob Johnson',
  role: 'STUDENT',
  warnings: 0,
  status: 'ACTIVE',
}

const comment = {
  id: 'comment-1',
  content: 'Root comment',
  status: 'VISIBLE',
  author: alice,
  postContext: 'CS101',
  lectureId: 'lecture-1',
  answers: 1,
  reports: 2,
  createdAt: '2026-06-03T10:00:00Z',
} satisfies ManagedComment

const answer = {
  id: 'answer-1',
  content: 'Nested answer',
  status: 'HIDDEN',
  author: bob,
  commentId: comment.id,
  commentPreview: comment.content,
  postContext: comment.postContext,
  reports: 1,
  createdAt: '2026-06-03T11:00:00Z',
} satisfies ManagedAnswer

describe('moderation model', () => {
  it('nests answers under their parent comments', () => {
    expect(attachReplies([comment], [answer])).toEqual([
      {
        id: 'comment-1',
        kind: 'comment',
        content: 'Root comment',
        status: 'VISIBLE',
        author: alice,
        postContext: 'CS101',
        detail: '1 answer',
        reports: 2,
        createdAt: '2026-06-03T10:00:00Z',
        replies: [
          {
            id: 'answer-1',
            kind: 'answer',
            content: 'Nested answer',
            status: 'HIDDEN',
            author: bob,
            postContext: 'CS101',
            detail: 'Re: Root comment',
            reports: 1,
            createdAt: '2026-06-03T11:00:00Z',
          },
        ],
      },
    ])
  })

  it('keeps matching replies visible under their comment context', () => {
    const items = attachReplies([comment], [answer])

    expect(narrowContent(items, 'nested', 'All')).toEqual([
      {
        ...items[0],
        replies: [items[0].replies![0]],
      },
    ])
    expect(findContent(items, { id: answer.id, kind: 'answer' })).toBe(items[0].replies![0])
  })

  it('maps and filters reports without losing content ids', () => {
    const commentReport = {
      id: 'report-1',
      commentId: comment.id,
      commentContent: comment.content,
      postContext: comment.postContext,
      reportText: 'Insulting',
      reportedUser: alice,
      reporter: bob,
      reason: 'INSULT',
      status: 'OPEN',
      date: '2026-06-03T12:00:00Z',
    } satisfies ReportedComment

    const answerReport = {
      id: 'report-2',
      answerId: answer.id,
      commentId: comment.id,
      answerContent: answer.content,
      commentContent: comment.content,
      postContext: answer.postContext,
      reportText: 'Spam',
      reportedUser: bob,
      reporter: alice,
      reason: 'SPAM',
      status: 'REVIEWED',
      date: '2026-06-03T13:00:00Z',
    } satisfies ReportedAnswer

    expect(toCommentReport(commentReport)).toMatchObject({
      id: 'report-1',
      kind: 'comment',
      contentId: 'comment-1',
      parentContent: null,
    })
    expect(toAnswerReport(answerReport)).toMatchObject({
      id: 'report-2',
      kind: 'answer',
      contentId: 'answer-1',
      parentContent: 'Root comment',
    })
    expect(matchesReportFilters(toCommentReport(commentReport), 'OPEN', 'INSULT')).toBe(true)
    expect(matchesReportFilters(toCommentReport(commentReport), 'REVIEWED', 'INSULT')).toBe(false)
  })

  it('builds a content edit update from only changed fields', () => {
    const item = attachReplies([comment], [answer])[0]

    expect(
      buildContentUpdate(item, {
        ...createContentEditDraft(item),
        content: '  Updated comment  ',
      }),
    ).toEqual({ content: 'Updated comment' })
  })

  it('starts deleted content edits from hidden visibility', () => {
    const deleted = { ...attachReplies([comment], [answer])[0], status: 'DELETED' as const }

    expect(toEditableStatus(deleted)).toBe('HIDDEN')
    expect(
      buildContentUpdate(deleted, { ...createContentEditDraft(deleted), status: 'VISIBLE' }),
    ).toEqual({ status: 'VISIBLE' })
  })

  it('requires non-empty changed content before saving an edit', () => {
    const item = attachReplies([comment], [answer])[0]

    expect(canSaveContentEdit(item, createContentEditDraft(item))).toBe(false)
    expect(canSaveContentEdit(item, { ...createContentEditDraft(item), content: '   ' })).toBe(
      false,
    )
    expect(canSaveContentEdit(item, { ...createContentEditDraft(item), status: 'HIDDEN' })).toBe(
      true,
    )
  })
})

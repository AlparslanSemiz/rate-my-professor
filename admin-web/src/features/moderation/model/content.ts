import { type ManagedAnswer, type ManagedComment } from '@/api/moderation'
import type { ContentStatus } from '@/domain/moderation'
import type { UserReference } from '@/domain/user'
import { ALL_FILTERS, type ContentStatusFilter } from './filterOptions'

/** Everything a mutation needs to address a comment or an answer: which one, and of which kind. */
export interface ContentRef {
  id: string
  kind: 'comment' | 'answer'
}

/**
 * A comment or an answer, flattened to what the moderation table renders. Both endpoints
 * return the same fields under different names, and the extra one each carries — the answer
 * count of a comment, the parent thread of an answer — reads as one secondary line.
 *
 * `kind` tells the page which service a mutation on this item belongs to. `replies` is only
 * populated on a comment: the answers nested under it in the table, fetched and attached by
 * the comments page itself.
 */
export interface ModeratedItem extends ContentRef {
  content: string
  status: ContentStatus
  author: UserReference
  postContext: string
  /** Second line under the lecture: the thread for an answer, the reply count for a comment. */
  detail: string
  reports: number
  createdAt: string
  readonly replies?: readonly ModeratedItem[]
}

/**
 * @param comment the comment as the backend sends it
 * @returns it flattened to what the table renders, with the answer count as its second line
 */
export function toModeratedComment(comment: ManagedComment): ModeratedItem {
  return {
    id: comment.id,
    kind: 'comment',
    content: comment.content,
    status: comment.status,
    author: comment.author,
    postContext: comment.postContext,
    detail: `${comment.answers} answer${comment.answers === 1 ? '' : 's'}`,
    reports: comment.reports,
    createdAt: comment.createdAt,
  }
}

/**
 * @param answer the answer as the backend sends it
 * @returns it flattened to what the table renders, with its parent thread as the second line
 */
export function toModeratedAnswer(answer: ManagedAnswer): ModeratedItem {
  return {
    id: answer.id,
    kind: 'answer',
    content: answer.content,
    status: answer.status,
    author: answer.author,
    postContext: answer.postContext,
    detail: `Re: ${answer.commentPreview}`,
    reports: answer.reports,
    createdAt: answer.createdAt,
  }
}

/** Nests each answer under its parent comment so the table can show it as an expandable reply. */
export function attachReplies(comments: ManagedComment[], answers: ManagedAnswer[]): ModeratedItem[] {
  const repliesByComment = new Map<string, ModeratedItem[]>()
  for (const answer of answers) {
    const replies = repliesByComment.get(answer.commentId) ?? []
    replies.push(toModeratedAnswer(answer))
    repliesByComment.set(answer.commentId, replies)
  }

  return comments.map((comment) => ({
    ...toModeratedComment(comment),
    replies: repliesByComment.get(comment.id) ?? [],
  }))
}

/**
 * The comment or answer a report is about, looked up in the content that is already loaded —
 * answers included, which live nested under their comment. Returns null when the content is
 * gone, which is possible: a report outlives nothing, but the two lists are read separately.
 */
export function findContent(items: ModeratedItem[], ref: ContentRef): ModeratedItem | null {
  for (const item of items) {
    if (item.kind === ref.kind && item.id === ref.id) return item
    const nested = item.replies?.find(
      (reply) => reply.kind === ref.kind && reply.id === ref.id,
    )
    if (nested) return nested
  }
  return null
}

/**
 * @param item the row to test
 * @param query the search text, already trimmed and lower-cased by the caller
 * @returns whether the text, the author or the lecture matches
 */
export function matchesContentQuery(item: ModeratedItem, query: string) {
  return (
    item.content.toLowerCase().includes(query) ||
    item.author.name.toLowerCase().includes(query) ||
    item.postContext.toLowerCase().includes(query)
  )
}

/**
 * @param item the row to test
 * @param status the status filter, or `ALL_FILTERS`
 * @returns whether the row survives the filter
 */
export function matchesContentFilters(item: ModeratedItem, status: ContentStatusFilter) {
  return status === ALL_FILTERS || item.status === status
}

function matchesContent(item: ModeratedItem, query: string, status: ContentStatusFilter) {
  return matchesContentQuery(item, query) && matchesContentFilters(item, status)
}

/**
 * Answers are rendered as rows nested under their comment, so a search or a status filter
 * that only looked at the parent would hide every matching answer — the text is in the
 * table, but nothing finds it.
 *
 * A comment that matches keeps its whole thread, because the surrounding replies are the
 * context the operator came for. A comment that does not match is kept only for the replies
 * that do, narrowed to exactly those.
 */
export function narrowContent(
  items: ModeratedItem[],
  search: string,
  status: ContentStatusFilter,
): ModeratedItem[] {
  const query = search.trim().toLowerCase()
  if (!query && status === ALL_FILTERS) return items

  const narrowed: ModeratedItem[] = []
  for (const item of items) {
    if (matchesContent(item, query, status)) {
      narrowed.push(item)
      continue
    }

    const matchingReplies = (item.replies ?? []).filter((reply) =>
      matchesContent(reply, query, status),
    )
    if (matchingReplies.length > 0) {
      narrowed.push({ ...item, replies: matchingReplies })
    }
  }
  return narrowed
}

/** A comment and every answer under it, as one list — what the table actually renders. */
export function flattenContent(items: ModeratedItem[]): ModeratedItem[] {
  return items.flatMap((item) => [item, ...(item.replies ?? [])])
}

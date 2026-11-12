import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type {
  ManagedAnswer,
  ManagedComment,
  ReportedAnswer,
  ReportedComment,
} from '@/api/moderation'
import { AuthProvider } from '@/context/AuthContext'
import { withQueryClient } from '@/test/queryClient'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { failure, ok } from '@/test/msw/envelope'
import { setSessionUser } from '@/test/msw/handlers/auth'
import { requestTo, requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { without } from '@/test/msw/wire'
import CommentsPage from './CommentsPage'

/**
 * The reference slice for MSW — see `docs/adr/0009-msw-slice-by-slice.md`.
 *
 * Nothing here replaces a service module. The page's real services run, `ApiClient` builds
 * real requests, and a handler answers them, so these tests assert the path, the method and
 * the body the screen actually produces. Under `vi.mock` none of those existed to assert.
 *
 * Comments is the right slice for it: it is the only screen driven through a `ModerationApi`
 * over *two* services, so a handler that gets the envelope wrong breaks it twice.
 */
startMockBackend()

const authUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@student.kit.edu',
  role: 'ADMIN',
}

const comments: ManagedComment[] = [
  {
    id: 'comment-1',
    content: 'Reported text',
    status: 'VISIBLE',
    author: { id: 'user-1', name: 'Alice Smith', role: 'STUDENT', warnings: 1, status: 'ACTIVE' },
    postContext: 'CS101 - Algorithms',
    lectureId: 'lecture-1',
    answers: 2,
    reports: 1,
    createdAt: '2026-06-03T16:20:00Z',
  },
  {
    id: 'comment-2',
    content: 'Hidden already',
    status: 'HIDDEN',
    author: { id: 'user-3', name: 'Carol White', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    postContext: 'CS102 - Databases',
    lectureId: 'lecture-2',
    answers: 0,
    reports: 0,
    createdAt: '2026-06-02T09:00:00Z',
  },
]

const answers: ManagedAnswer[] = [
  {
    id: 'answer-1',
    content: 'I had the same issue',
    status: 'VISIBLE',
    author: { id: 'user-5', name: 'Erin Lee', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    commentId: 'comment-1',
    commentPreview: 'Reported text',
    postContext: 'CS101 - Algorithms',
    reports: 0,
    createdAt: '2026-06-03T17:00:00Z',
  },
]

const answerReports: ReportedAnswer[] = [
  {
    id: 'answer-report-1',
    answerId: 'answer-1',
    commentId: 'comment-1',
    answerContent: 'I had the same issue',
    commentContent: 'Reported text',
    postContext: 'CS101 - Algorithms',
    reportText: 'Off topic',
    reportedUser: { id: 'user-5', name: 'Erin Lee', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    reporter: { id: 'user-6', name: 'Frank Green', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    reason: 'OFF_TOPIC',
    status: 'OPEN',
    date: '2026-06-03T17:05:00Z',
  },
]

const reports: ReportedComment[] = [
  {
    id: 'report-1',
    commentId: 'comment-1',
    commentContent: 'Reported text',
    postContext: 'CS101 - Algorithms',
    reportText: 'Harassment report',
    reportedUser: { id: 'user-1', name: 'Alice Smith', role: 'STUDENT', warnings: 1, status: 'ACTIVE' },
    reporter: { id: 'user-2', name: 'Bob Johnson', role: 'ADMIN', warnings: 0, status: 'ACTIVE' },
    reason: 'HARASSMENT',
    status: 'OPEN',
    date: '2026-06-03T16:22:00Z',
  },
  {
    id: 'report-2',
    commentId: 'comment-2',
    commentContent: 'Unrelated comment',
    postContext: 'CS102 - Databases',
    reportText: 'Looks like spam',
    reportedUser: { id: 'user-3', name: 'Carol White', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    reporter: { id: 'user-4', name: 'Dan Brown', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
    reason: 'SPAM',
    status: 'REVIEWED',
    date: '2026-06-02T10:00:00Z',
  },
]

function renderComments() {
  localStorage.setItem('token', 'admin-token')
  localStorage.setItem('user', JSON.stringify(authUser))

  return render(
    <MantineProvider>
      <AuthProvider>{withQueryClient(<CommentsPage />)}</AuthProvider>
    </MantineProvider>
  )
}

async function openReportsTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('tab', { name: /Reports/ }))
}

async function chooseActionTaken(user: ReturnType<typeof userEvent.setup>, select: HTMLElement) {
  await user.click(select)
  await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')
}

describe('Comments page', () => {
  beforeEach(() => {
    seedDb({ comments, answers, commentReports: reports, answerReports })
    setSessionUser({
      id: authUser.id,
      username: authUser.name,
      kitEmail: authUser.email,
      role: authUser.role,
    })
  })

  it('lists every comment and filters them by text, author, or lecture', async () => {
    const user = userEvent.setup()
    renderComments()

    expect(await screen.findByText('Reported text')).toBeInTheDocument()
    expect(screen.getByText('Hidden already')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Search comments' }), 'Carol')

    expect(screen.getByText('Hidden already')).toBeInTheDocument()
    expect(screen.queryByText('Reported text')).not.toBeInTheDocument()
  })

  it('finds an answer by its own text and reveals it under its comment', async () => {
    const user = userEvent.setup()
    renderComments()

    await screen.findByText('Reported text')
    // Answers are nested, so a search that only looked at comments would report nothing
    // here even though the text is in the table.
    await user.type(screen.getByRole('textbox', { name: 'Search comments' }), 'same issue')

    expect(await screen.findByText('I had the same issue')).toBeInTheDocument()
    // The parent is kept for context; the unrelated comment is not.
    expect(screen.getByText('Reported text')).toBeInTheDocument()
    expect(screen.queryByText('Hidden already')).not.toBeInTheDocument()
  })

  it('counts answers in the content statistics, not only comments', async () => {
    renderComments()

    await screen.findByText('Reported text')
    // Two comments plus one answer, all moderated from this table.
    const total = screen.getByText('Total comments').closest('div')
    expect(total).toHaveTextContent(/^3Total comments$/)
  })

  it('puts the numbers above the tab strip, the way every other screen does', async () => {
    renderComments()
    await screen.findByText('Reported text')

    // `F-065`. Measured at 1280: this screen's tab strip started at y=117.80 and the catalogue's
    // at y=220.59 - 102.79px apart for the same control doing the same job. The cause was the
    // order: the catalogue renders its cards once, above `Tabs`, while this screen rendered a
    // different card set inside each panel, so the strip came first.
    //
    // Asserted as document order rather than as a coordinate, because jsdom has no layout. The
    // browser measurement that this order produces the same y on every screen is in
    // `docs/coursework/layout-audit.md`.
    const cards = screen.getByText('Total comments')
    const tabs = screen.getByRole('tablist')
    const cardsComeFirst = cards.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING

    expect(cardsComeFirst).toBeTruthy()
  })

  it('swaps the numbers when the tab changes, rather than keeping one set', async () => {
    const user = userEvent.setup()
    renderComments()
    await screen.findByText('Reported text')

    // The cards moved out of the panels, so they now have to follow the tab themselves. This is
    // the assertion that stops them being hoisted and then frozen on the first tab's numbers.
    expect(screen.getByText('Total comments')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Reports/ }))

    await waitFor(() => expect(screen.queryByText('Total comments')).not.toBeInTheDocument())
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('saves only the fields an edit actually changed', async () => {
    const user = userEvent.setup()
    renderComments()

    await user.click(await screen.findByRole('button', { name: 'Edit content by Alice Smith' }))
    const dialog = await screen.findByRole('dialog')
    const textarea = within(dialog).getByRole('textbox', { name: 'Text' })
    await user.clear(textarea)
    await user.type(textarea, 'Corrected text')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requestsTo('PATCH', '/api/comments/comment-1')).toHaveLength(1))
    const request = requestTo('PATCH', '/api/comments/comment-1')
    // Only the field that changed. The status was not touched, so it is not sent — an empty
    // body is refused and an unchanged field still writes an audit entry.
    expect(request.body).toEqual({ content: 'Corrected text' })
    expect(request.authorization).toBe('Bearer admin-token')
  })

  it('deletes a comment only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderComments()

    await user.click(await screen.findByRole('button', { name: 'Delete content by Alice Smith' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(requestsTo('DELETE', '/api/comments/comment-1')).toHaveLength(1))
    // The comment is addressed, not the report about it — different paths, different acts.
    expect(requestsTo('DELETE', '/api/comments/reported/report-1')).toHaveLength(0)
  })

  it('opens the editor when the row itself is pressed', async () => {
    const user = userEvent.setup()
    renderComments()

    await user.click(await screen.findByText('Reported text'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Text' })).toHaveValue('Reported text')
  })

  it('does not open the editor when a control inside the row is pressed', async () => {
    const user = userEvent.setup()
    renderComments()

    // Delete opens its own confirmation; expanding opens nothing. Neither may also fire the
    // row's click and leave the edit form sitting behind the dialog.
    await user.click(await screen.findByRole('button', { name: 'Delete content by Alice Smith' }))
    expect(within(await screen.findByRole('dialog')).queryByRole('textbox', { name: 'Text' })).toBeNull()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await user.click(screen.getByRole('button', { name: "Expand answers under Alice Smith's comment" }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lays the content table out fixed so expanding a thread cannot shift the columns', async () => {
    renderComments()

    await screen.findByText('Reported text')
    const table = document.querySelector('table')

    // The reason the columns used to jump: automatic layout re-measured all seven every time
    // an indented answer row appeared. jsdom has no layout engine, so this asserts the fix is
    // still declared rather than observing the movement it prevents.
    expect(table).toHaveStyle({ tableLayout: 'fixed' })
    expect(table?.querySelectorAll('colgroup > col')).toHaveLength(7)
  })

  it('nests an answer under its comment and reveals it on expand', async () => {
    const user = userEvent.setup()
    renderComments()

    await screen.findByText('Reported text')
    expect(screen.queryByText('I had the same issue')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "Expand answers under Alice Smith's comment" }))

    expect(await screen.findByText('I had the same issue')).toBeInTheDocument()
  })

  it('edits an expanded answer through the answers service, not the comments one', async () => {
    const user = userEvent.setup()
    renderComments()

    await screen.findByText('Reported text')
    await user.click(screen.getByRole('button', { name: "Expand answers under Alice Smith's comment" }))
    await user.click(await screen.findByRole('button', { name: 'Edit content by Erin Lee' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Edit answer')).toBeInTheDocument()
    const textarea = within(dialog).getByRole('textbox', { name: 'Text' })
    await user.clear(textarea)
    await user.type(textarea, 'Corrected answer')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requestsTo('PATCH', '/api/answers/answer-1')).toHaveLength(1))
    expect(requestTo('PATCH', '/api/answers/answer-1').body).toEqual({
      content: 'Corrected answer',
    })
    // Routed to `/answers`, not `/comments`. Under a service mock this asserted that one
    // double was called and another was not; here it asserts the path that went out.
    expect(requestsTo('PATCH', '/api/comments/comment-1')).toHaveLength(0)
  })

  it('filters reports by comment, user, or report text', async () => {
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    expect(await screen.findByText('"Reported text"')).toBeInTheDocument()
    expect(screen.getByText('"Unrelated comment"')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Search reported comments' }), 'Alice')

    expect(screen.getByText('"Reported text"')).toBeInTheDocument()
    expect(screen.queryByText('"Unrelated comment"')).not.toBeInTheDocument()
  })

  it('updates a report status and re-reads what the change did to the content', async () => {
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    const statusSelect = await screen.findByRole('combobox', {
      name: 'Status for report by Alice Smith',
    })
    await chooseActionTaken(user, statusSelect)

    await waitFor(() =>
      expect(requestsTo('PATCH', '/api/comments/reported/report-1')).toHaveLength(1),
    )
    expect(requestTo('PATCH', '/api/comments/reported/report-1').body).toEqual({
      status: 'ACTION_TAKEN',
    })
    // ACTION_TAKEN hides the comment, so both lists are re-read rather than patched locally.
    await waitFor(() => expect(requestsTo('GET', '/api/comments')).toHaveLength(2))
    // And the content really is hidden now. The handler applies the rule the backend does, so
    // coming back to the content tab shows a second hidden comment — one was hidden already,
    // and Alice's has just joined it. Under a service mock this could not be checked at all:
    // nothing was re-read, so nothing could have changed.
    await user.click(screen.getByRole('tab', { name: /All comments/ }))
    const row = await screen.findByLabelText('Edit comment by Alice Smith')
    await waitFor(() => expect(within(row).getByText('Hidden')).toBeInTheDocument())
  })

  it('restores the content when a report moves to any status other than ACTION_TAKEN', async () => {
    // The other half of the rule, and the half no test covered: `ACTION_TAKEN` hides content
    // and *every other status puts it back*. It is documented as a decision in
    // `ReportsService` and implemented in the backend, so the only way to check it is to make
    // a real request and read what the next one returns.
    seedDb({
      comments: [{ ...comments[0], status: 'HIDDEN' }],
      answers: [],
      commentReports: [{ ...reports[0], status: 'ACTION_TAKEN' }],
      answerReports: [],
    })
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    const statusSelect = await screen.findByRole('combobox', {
      name: 'Status for report by Alice Smith',
    })
    // Driven by keyboard rather than by clicking the option: the filter above the table
    // offers the same four statuses, so `getByRole('option', …)` matches twice. Navigation
    // starts from the current value, which is ACTION_TAKEN, so one step up is Dismissed.
    await user.click(statusSelect)
    await user.keyboard('{ArrowUp}{Enter}')

    await waitFor(() =>
      expect(requestTo('PATCH', '/api/comments/reported/report-1').body).toEqual({
        status: 'DISMISSED',
      }),
    )

    await user.click(screen.getByRole('tab', { name: /All comments/ }))
    const row = await screen.findByLabelText('Edit comment by Alice Smith')
    await waitFor(() => expect(within(row).getByText('Visible')).toBeInTheDocument())
  })

  it('shows an error and keeps the report when an update fails', async () => {
    server.use(
      http.patch(apiUrl('/comments/reported/:id'), () => failure(500, 'Update rejected')),
    )
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    const statusSelect = await screen.findByRole('combobox', {
      name: 'Status for report by Alice Smith',
    })
    await chooseActionTaken(user, statusSelect)

    expect(await screen.findByText('Update rejected')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Status for report by Alice Smith' })
    ).toHaveValue('Open')
  })

  it('withdraws a report without touching the comment', async () => {
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    await user.click(await screen.findByRole('button', { name: 'Withdraw report by Bob Johnson' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw report' }))

    await waitFor(() =>
      expect(requestsTo('DELETE', '/api/comments/reported/report-1')).toHaveLength(1),
    )
    // The report is withdrawn; the comment is not touched at all.
    expect(requestsTo('PATCH', '/api/comments/comment-1')).toHaveLength(0)
    expect(requestsTo('DELETE', '/api/comments/comment-1')).toHaveLength(0)
  })

  it('edits the reported comment from the reports tab', async () => {
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    await user.click(
      await screen.findByRole('button', { name: 'Edit the reported comment by Alice Smith' }),
    )

    // The real comment, with the visibility the backend reports — not a stand-in assembled
    // from the report, which carries the text but not the status.
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByRole('textbox', { name: 'Text' })).toHaveValue('Reported text')
    // The comment's real visibility, which only the content list knows — the report carries
    // the text and nothing about the state of the thing it is about.
    expect(dialog.getByRole('combobox', { name: 'Visibility' })).toHaveValue('Visible')

    await user.clear(dialog.getByRole('textbox', { name: 'Text' }))
    await user.type(dialog.getByRole('textbox', { name: 'Text' }), 'Rewritten by an admin')
    await user.click(dialog.getByRole('button', { name: 'Save changes' }))

    // Addressed by the comment's id, which is not the report's id — and now that is a path
    // rather than an argument, so getting it wrong would be a request to `/comments/report-1`.
    await waitFor(() => expect(requestsTo('PATCH', '/api/comments/comment-1')).toHaveLength(1))
    expect(requestTo('PATCH', '/api/comments/comment-1').body).toEqual({
      content: 'Rewritten by an admin',
    })
  })

  it('deletes the reported answer from the reports tab', async () => {
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    await user.click(
      await screen.findByRole('button', { name: 'Delete the reported answer by Erin Lee' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(requestsTo('DELETE', '/api/answers/answer-1')).toHaveLength(1))
    // The content was deleted, not the report withdrawn — different addresses, different acts.
    expect(requestsTo('DELETE', '/api/answers/reported/answer-report-1')).toHaveLength(0)
  })

  it('shows a load error and retries the request', async () => {
    server.use(
      http.get(apiUrl('/comments/reported'), () => failure(503, 'Backend unavailable'), {
        once: true,
      }),
    )
    const user = userEvent.setup()
    renderComments()

    expect(await screen.findByText('Backend unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Reported text')).toBeInTheDocument()
    expect(requestsTo('GET', '/api/comments/reported')).toHaveLength(2)
  })

  /**
   * `F-022`, measured and **deliberately not fixed** — the moderation half of the same
   * asymmetry as the audit log's actor. `ModeratedItem.author` is declared non-null and read
   * without a guard in four places, while `ratingMapper` and `userWarningMapper` both defend
   * theirs. `docs/consumer-findings.md` C-07.
   *
   * The fix is a nullable domain type reaching every read site, which is not a change to make
   * on the last day. Recorded as a risk in `docs/TODO.md`; this test says what the risk *is*
   * rather than leaving it as prose.
   */
  it('is measured, not fixed: a comment with no author takes the table down', async () => {
    const withoutAuthor = without(comments[0], 'author')
    server.use(
      http.get(apiUrl('/comments'), () => ok({ comments: [withoutAuthor] })),
    )

    renderComments()

    // The row never arrives. `ContentRow` reads `item.author.name` into its accessible label,
    // so the throw happens before anything is painted — this is not a missing cell.
    await waitFor(() =>
      expect(screen.queryByText('Reported text')).not.toBeInTheDocument()
    )
  })
})

import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { answersService, type ManagedAnswer, type ReportedAnswer } from '../../api/AnswersService'
import {
  commentsService,
  type ManagedComment,
  type ReportedComment,
} from '../../api/CommentsService'
import { AuthProvider } from '../../context/AuthContext'
import CommentsPage from './CommentsPage'

vi.mock('../../api/AuthService', () => ({
  authService: {
    me: vi.fn().mockResolvedValue({ success: true, message: 'Signed in' }),
  },
}))

vi.mock('../../api/CommentsService', () => ({
  commentsService: {
    getAll: vi.fn(),
    getReported: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
    deleteReport: vi.fn(),
  },
}))

vi.mock('../../api/AnswersService', () => ({
  answersService: {
    getAll: vi.fn(),
    getReported: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
    deleteReport: vi.fn(),
  },
}))

vi.mock('../../api/UsersService', () => ({
  usersService: {
    getById: vi.fn(),
    getWarnings: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    warn: vi.fn(),
    updateWarning: vi.fn(),
    deleteWarning: vi.fn(),
  },
}))

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
    postContext: 'CS101 — Algorithms',
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
    postContext: 'CS102 — Databases',
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
    postContext: 'CS101 — Algorithms',
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
    postContext: 'CS101 — Algorithms',
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
    postContext: 'CS101 — Algorithms',
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
    postContext: 'CS102 — Databases',
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
      <AuthProvider>
        <CommentsPage />
      </AuthProvider>
    </MantineProvider>
  )
}

async function openReportsTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('tab', { name: /Reports/ }))
}

function openStatusOptions(select: HTMLElement) {
  const optionsId = select.getAttribute('aria-controls')
  const options = optionsId ? document.getElementById(optionsId) : null
  expect(options).not.toBeNull()
  return options as HTMLElement
}

describe('Comments page', () => {
  beforeEach(() => {
    vi.mocked(commentsService.getAll).mockResolvedValue(comments)
    vi.mocked(commentsService.getReported).mockResolvedValue(reports)
    vi.mocked(commentsService.update).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(commentsService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(commentsService.updateStatus).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(commentsService.deleteReport).mockResolvedValue({ success: true, message: 'Deleted' })

    vi.mocked(answersService.getAll).mockResolvedValue(answers)
    vi.mocked(answersService.getReported).mockResolvedValue(answerReports)
    vi.mocked(answersService.update).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(answersService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(answersService.updateStatus).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(answersService.deleteReport).mockResolvedValue({ success: true, message: 'Deleted' })
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

  it('saves only the fields an edit actually changed', async () => {
    const user = userEvent.setup()
    renderComments()

    await user.click(await screen.findByRole('button', { name: 'Edit content by Alice Smith' }))
    const dialog = await screen.findByRole('dialog')
    const textarea = within(dialog).getByRole('textbox', { name: 'Text' })
    await user.clear(textarea)
    await user.type(textarea, 'Corrected text')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(commentsService.update).toHaveBeenCalledWith('comment-1', {
        content: 'Corrected text',
      })
    })
  })

  it('deletes a comment only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderComments()

    await user.click(await screen.findByRole('button', { name: 'Delete content by Alice Smith' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(commentsService.delete).toHaveBeenCalledWith('comment-1'))
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

    await waitFor(() => {
      expect(answersService.update).toHaveBeenCalledWith('answer-1', { content: 'Corrected answer' })
    })
    expect(commentsService.update).not.toHaveBeenCalled()
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
    await user.click(statusSelect)
    fireEvent.click(
      within(openStatusOptions(statusSelect)).getByRole('option', {
        name: 'Action Taken',
        hidden: true,
      })
    )

    await waitFor(() => {
      expect(commentsService.updateStatus).toHaveBeenCalledWith('report-1', 'ACTION_TAKEN')
    })
    // ACTION_TAKEN hides the comment, so both lists are re-read rather than patched locally.
    await waitFor(() => expect(commentsService.getAll).toHaveBeenCalledTimes(2))
  })

  it('shows an error and keeps the report when an update fails', async () => {
    vi.mocked(commentsService.updateStatus).mockRejectedValue(new Error('Update rejected'))
    const user = userEvent.setup()
    renderComments()
    await openReportsTab(user)

    const statusSelect = await screen.findByRole('combobox', {
      name: 'Status for report by Alice Smith',
    })
    await user.click(statusSelect)
    fireEvent.click(
      within(openStatusOptions(statusSelect)).getByRole('option', {
        name: 'Action Taken',
        hidden: true,
      })
    )

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

    await waitFor(() => expect(commentsService.deleteReport).toHaveBeenCalledWith('report-1'))
    expect(commentsService.update).not.toHaveBeenCalled()
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

    // Addressed by the comment's id, which is not the report's id.
    await waitFor(() =>
      expect(commentsService.update).toHaveBeenCalledWith('comment-1', {
        content: 'Rewritten by an admin',
      }),
    )
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

    await waitFor(() => expect(answersService.delete).toHaveBeenCalledWith('answer-1'))
    // The content was deleted, not the report withdrawn — different addresses, different acts.
    expect(answersService.deleteReport).not.toHaveBeenCalled()
  })

  it('shows a load error and retries the request', async () => {
    vi.mocked(commentsService.getReported)
      .mockRejectedValueOnce(new Error('Backend unavailable'))
      .mockResolvedValue(reports)
    const user = userEvent.setup()
    renderComments()

    expect(await screen.findByText('Backend unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Reported text')).toBeInTheDocument()
    expect(commentsService.getReported).toHaveBeenCalledTimes(2)
  })
})

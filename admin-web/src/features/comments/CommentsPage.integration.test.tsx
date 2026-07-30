import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  commentsService,
  type ManagedComment,
  type ReportedComment,
} from '../../api/CommentsService'
import { AuthProvider } from '../../context/AuthContext'
import CommentsPage from './CommentsPage'

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

const reports: ReportedComment[] = [
  {
    id: 'report-1',
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

import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { commentsService, type ReportedComment } from '../api/CommentsService'
import { AuthProvider } from '../context/AuthContext'
import CommentsPage from './Comments'

vi.mock('../api/CommentsService', () => ({
  commentsService: {
    getReported: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

vi.mock('../api/UsersService', () => ({
  usersService: {
    getById: vi.fn(),
    getWarnings: vi.fn(),
    delete: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    warn: vi.fn(),
  },
}))

const authUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@student.kit.edu',
  role: 'ADMIN',
}

const reports: ReportedComment[] = [
  {
    id: 'report-1',
    commentContent: 'Reported text',
    postContext: 'Post title',
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
    postContext: 'Another post',
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

describe('Comments page', () => {
  beforeEach(() => {
    vi.mocked(commentsService.getReported).mockResolvedValue(reports)
    vi.mocked(commentsService.updateStatus).mockResolvedValue({ success: true, message: 'Updated' })
  })

  it('loads reports and filters by comment, user, or report text', async () => {
    const user = userEvent.setup()
    renderComments()

    expect(await screen.findByText('"Reported text"')).toBeInTheDocument()
    expect(screen.getByText('"Unrelated comment"')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Search reported comments' }), 'Alice')

    expect(screen.getByText('"Reported text"')).toBeInTheDocument()
    expect(screen.queryByText('"Unrelated comment"')).not.toBeInTheDocument()
  })

  it('updates a report status only after the API confirms the change', async () => {
    const user = userEvent.setup()
    renderComments()

    await screen.findByText('"Reported text"')
    const statusSelect = screen.getByRole('combobox', { name: 'Status for report by Alice Smith' })
    await user.click(statusSelect)
    const optionsId = statusSelect.getAttribute('aria-controls')
    const options = optionsId ? document.getElementById(optionsId) : null
    expect(options).not.toBeNull()
    fireEvent.click(within(options as HTMLElement).getByRole('option', { name: 'Action Taken', hidden: true }))

    await waitFor(() => {
      expect(commentsService.updateStatus).toHaveBeenCalledWith('report-1', 'ACTION_TAKEN')
    })
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Status for report by Alice Smith' })).toHaveValue('Action Taken')
    })
  })

  it('shows a load error and retries the request', async () => {
    vi.mocked(commentsService.getReported)
      .mockRejectedValueOnce(new Error('Backend unavailable'))
      .mockResolvedValueOnce(reports)
    const user = userEvent.setup()
    renderComments()

    expect(await screen.findByText('Backend unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('"Reported text"')).toBeInTheDocument()
    expect(commentsService.getReported).toHaveBeenCalledTimes(2)
  })
})

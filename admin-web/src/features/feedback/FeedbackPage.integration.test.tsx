import { MantineProvider } from '@mantine/core'
import { withQueryClient } from '@/test/queryClient'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { feedbackService, type BugReport } from '@/api/feedback'
import { systemStatusService, type SystemStatus } from '@/api/system'
import FeedbackPage from './FeedbackPage'

vi.mock('@/api/feedback', () => ({
  feedbackService: {
    getReports: vi.fn(),
    updateReport: vi.fn(),
    createGitlabIssue: vi.fn(),
    deleteReport: vi.fn(),
  },
}))

vi.mock('@/api/system', () => ({
  systemStatusService: {
    getStatus: vi.fn(),
  },
}))

const status: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: null,
  uptimeSeconds: null,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: null,
  lastWrite: null,
  gitlabEnabled: true,
}

const reports: BugReport[] = [
  {
    id: 'report-1',
    title: 'Crash on login',
    description: 'App crashes when submitting the login form.',
    severity: 'HIGH',
    status: 'OPEN',
    reporterName: 'Alice Smith',
    reportedAt: '2026-06-11T18:30:00Z',
    issueUrl: null,
    issueState: 'NONE',
  },
  {
    id: 'report-2',
    title: 'Typo on profile page',
    description: 'Minor spelling mistake in the bio field label.',
    severity: 'LOW',
    status: 'REVIEWED',
    reporterName: 'Bob Johnson',
    reportedAt: '2026-06-10T22:15:00Z',
    issueUrl: 'https://gitlab.example.com/team/app/-/issues/42',
    issueState: 'CREATED',
  },
]

function renderFeedback() {
  return render(<MantineProvider>{withQueryClient(<FeedbackPage />)}</MantineProvider>)
}

describe('Feedback page', () => {
  // The backend owns the result of an edit and the page only shows what it re-read, so the
  // fixture records what the backend now holds and `getReports` serves a copy of that.
  let queue: BugReport[]

  beforeEach(() => {
    queue = reports.map((report) => ({ ...report }))
    vi.mocked(systemStatusService.getStatus).mockResolvedValue(status)
    vi.mocked(feedbackService.createGitlabIssue).mockImplementation(async (id) => {
      const stored = queue.find((report) => report.id === id)
      const issueUrl = 'https://gitlab.example.com/team/app/-/issues/7'
      if (stored) Object.assign(stored, { issueUrl, issueState: 'CREATED' })
      return { success: true, message: 'Issue created', issueUrl, issueIid: 7, issueState: 'CREATED' }
    })
    vi.mocked(feedbackService.getReports).mockImplementation(async () =>
      queue.map((report) => ({ ...report }))
    )
    vi.mocked(feedbackService.deleteReport).mockImplementation(async (id) => {
      queue = queue.filter((report) => report.id !== id)
      return { success: true, message: 'Deleted' }
    })
    vi.mocked(feedbackService.updateReport).mockImplementation(async (id, update) => {
      const stored = queue.find((report) => report.id === id)
      if (stored) Object.assign(stored, update)
      return { success: true, message: 'Updated' }
    })
  })

  it('opens the report detail modal when a row is clicked', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Bug Report')).toBeInTheDocument()
    expect(dialog.getByText('App crashes when submitting the login form.')).toBeInTheDocument()
    expect(dialog.getByText('Reported by Alice Smith')).toBeInTheDocument()
  })

  it('opens the report detail modal via keyboard (Enter)', async () => {
    const user = userEvent.setup()
    renderFeedback()

    const report = await screen.findByRole('button', { name: 'Open bug report: Crash on login' })
    report.focus()
    await user.keyboard('{Enter}')

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Bug Report')).toBeInTheDocument()
    expect(dialog.getByText('App crashes when submitting the login form.')).toBeInTheDocument()
  })

  it('changes status from the modal and reflects it in the list after closing', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Bug Report')).toBeInTheDocument()

    await user.click(dialog.getByLabelText('Status'))
    // Mantine's dropdown is positioned via floating-ui, which never resolves a
    // non-zero layout in jsdom, so the option stays `display: none` even though
    // it's logically open (aria-expanded="true"). fireEvent bypasses the
    // visibility/hit-test check that userEvent would otherwise fail on.
    fireEvent.click(await screen.findByRole('option', { name: 'Action Taken', hidden: true }))

    await waitFor(() => expect(feedbackService.updateReport).toHaveBeenCalledWith('report-1', { status: 'ACTION_TAKEN' }))

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Acted on means finished, so it leaves the queue rather than sitting in it wearing a
    // different badge. It is in History, with its new status.
    await waitFor(() => expect(screen.queryByText('Crash on login')).toBeNull())
    await user.click(screen.getByRole('tab', { name: /History/ }))
    expect(await screen.findByText('Crash on login')).toBeInTheDocument()
    expect(screen.getAllByText('Action Taken')).not.toHaveLength(0)
  })

  it('changes severity from the modal and reflects it in the list after closing', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Bug Report')).toBeInTheDocument()

    await user.click(dialog.getByLabelText('Severity'))
    fireEvent.click(await screen.findByRole('option', { name: 'Critical', hidden: true }))

    await waitFor(() => expect(feedbackService.updateReport).toHaveBeenCalledWith('report-1', { severity: 'CRITICAL' }))

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(screen.getAllByText('Critical severity')).not.toHaveLength(0)
  })

  it('keeps open and reviewed reports in the queue and closed ones in history', async () => {
    const user = userEvent.setup()
    renderFeedback()

    // OPEN and REVIEWED are both still work; only ACTION_TAKEN and DISMISSED are done.
    expect(await screen.findByRole('tab', { name: 'Queue (2)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'History (0)' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /History/ }))
    expect(await screen.findByText('Nothing here yet. No report has been closed.')).toBeInTheDocument()
  })

  it('files a dismissed report under history too', async () => {
    queue[1] = { ...queue[1], status: 'DISMISSED' }
    const user = userEvent.setup()
    renderFeedback()

    expect(await screen.findByRole('tab', { name: 'Queue (1)' })).toBeInTheDocument()
    expect(screen.queryByText('Typo on profile page')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'History (1)' }))
    expect(await screen.findByText('Typo on profile page')).toBeInTheDocument()
  })

  it('shows an error and keeps the old status when the backend rejects the update', async () => {
    vi.mocked(feedbackService.updateReport).mockRejectedValue(new Error('Request failed with status 403'))
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    const dialog = within(await screen.findByRole('dialog'))

    await user.click(dialog.getByLabelText('Status'))
    fireEvent.click(await screen.findByRole('option', { name: 'Action Taken', hidden: true }))

    expect(await dialog.findByText('Request failed with status 403')).toBeInTheDocument()
    // Status badge in the modal header stays on the pre-update value; the
    // change is never applied locally unless the backend confirms it.
    expect(dialog.getByText('Open')).toBeInTheDocument()
    expect(dialog.queryByText('Action Taken')).not.toBeInTheDocument()
  })

  it('reports a change the backend accepted as saved, even when the re-read fails', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    const dialog = within(await screen.findByRole('dialog'))
    // The write lands; only the read that follows it does not.
    vi.mocked(feedbackService.getReports).mockRejectedValueOnce(new Error('Database unavailable'))

    await user.click(dialog.getByLabelText('Status'))
    fireEvent.click(await screen.findByRole('option', { name: 'Action Taken', hidden: true }))

    await waitFor(() => expect(feedbackService.updateReport).toHaveBeenCalledWith('report-1', { status: 'ACTION_TAKEN' }))

    // Not "the change was not saved" — it was. The view is what is out of date.
    expect(await screen.findByText(/reading it back failed/)).toHaveTextContent('Database unavailable')
    expect(screen.queryByText(/The change was not saved/)).not.toBeInTheDocument()
  })
  it('deletes a report and drops it from the queue', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    await user.click(await screen.findByRole('button', { name: 'Delete report' }))
    // Both the trigger and the confirmation say "Delete report", so the second is scoped to
    // the confirmation dialog rather than picked by position.
    const confirmation = within(await screen.findByRole('dialog', { name: 'Delete bug report' }))
    await user.click(confirmation.getByRole('button', { name: 'Delete report' }))

    await waitFor(() => expect(feedbackService.deleteReport).toHaveBeenCalledWith('report-1'))
    await waitFor(() => expect(screen.queryByText('Crash on login')).not.toBeInTheDocument())
  })

  it('keeps the report and says so when the backend refuses the delete', async () => {
    vi.mocked(feedbackService.deleteReport).mockRejectedValueOnce(
      new Error('The report is referenced by an open issue.')
    )
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    await user.click(await screen.findByRole('button', { name: 'Delete report' }))
    // Both the trigger and the confirmation say "Delete report", so the second is scoped to
    // the confirmation dialog rather than picked by position.
    const confirmation = within(await screen.findByRole('dialog', { name: 'Delete bug report' }))
    await user.click(confirmation.getByRole('button', { name: 'Delete report' }))

    // Before this the rejection escaped unhandled and the row vanished anyway.
    expect(
      await screen.findByText('The report is referenced by an open issue.')
    ).toBeInTheDocument()
    // The row is still in the queue. The title also appears in the open modals, so this asks
    // the list itself rather than matching the text anywhere on screen.
    expect(
      screen.getByRole('button', { name: 'Open bug report: Crash on login' })
    ).toBeInTheDocument()
  })

  it('creates a GitLab issue and then shows the link the backend reported', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))
    const dialog = within(await screen.findByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Create issue' }))

    await waitFor(() => expect(feedbackService.createGitlabIssue).toHaveBeenCalledWith('report-1'))
    // The link comes from the re-read queue, not from the response the button received.
    expect(await dialog.findByRole('link', { name: /Open issue on GitLab/ })).toHaveAttribute(
      'href',
      'https://gitlab.example.com/team/app/-/issues/7',
    )
  })

  it('links to the issue a report already has instead of offering to create one', async () => {
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Typo on profile page'))

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByRole('link', { name: /Open issue on GitLab/ })).toHaveAttribute(
      'href',
      'https://gitlab.example.com/team/app/-/issues/42',
    )
    expect(dialog.queryByRole('button', { name: 'Create issue' })).not.toBeInTheDocument()
  })

  it('hides the control entirely while the backend has no GitLab credentials', async () => {
    vi.mocked(systemStatusService.getStatus).mockResolvedValue({ ...status, gitlabEnabled: false })
    const user = userEvent.setup()
    renderFeedback()

    await user.click(await screen.findByText('Crash on login'))

    const dialog = within(await screen.findByRole('dialog'))
    // The endpoint answers 503 in this state, so the button is never offered to be pressed.
    expect(dialog.queryByRole('button', { name: 'Create issue' })).not.toBeInTheDocument()
  })

})

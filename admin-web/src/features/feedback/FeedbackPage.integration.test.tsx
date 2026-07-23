import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { feedbackService, type BugReport } from '../../api/FeedbackService'
import FeedbackPage from './FeedbackPage'

vi.mock('../../api/FeedbackService', () => ({
  feedbackService: {
    getReports: vi.fn(),
    updateReport: vi.fn(),
  },
}))

const reports: BugReport[] = [
  {
    id: 'report-1',
    title: 'Crash on login',
    description: 'App crashes when submitting the login form.',
    severity: 'HIGH',
    status: 'OPEN',
    reporterName: 'Alice Smith',
    reportedAt: '2026-06-11T18:30:00Z',
  },
  {
    id: 'report-2',
    title: 'Typo on profile page',
    description: 'Minor spelling mistake in the bio field label.',
    severity: 'LOW',
    status: 'REVIEWED',
    reporterName: 'Bob Johnson',
    reportedAt: '2026-06-10T22:15:00Z',
  },
]

function renderFeedback() {
  return render(
    <MantineProvider>
      <FeedbackPage />
    </MantineProvider>
  )
}

describe('Feedback page', () => {
  beforeEach(() => {
    vi.mocked(feedbackService.getReports).mockResolvedValue(reports)
    vi.mocked(feedbackService.updateReport).mockResolvedValue({ success: true, message: 'Updated' })
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

    expect(screen.getAllByText('Critical')).not.toHaveLength(0)
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
})

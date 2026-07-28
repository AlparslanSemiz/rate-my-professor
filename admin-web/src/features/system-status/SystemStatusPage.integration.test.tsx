import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiClient'
import { systemStatusService, type SystemStatus } from '../../api/SystemStatusService'
import SystemStatusPage from './SystemStatusPage'

vi.mock('../../api/SystemStatusService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/SystemStatusService')>()
  return {
    ...original,
    systemStatusService: {
      getStatus: vi.fn(),
    },
  }
})

const healthyStatus: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-07-28T13:40:00.000Z',
  version: '1.4.2',
  uptimeSeconds: 128_400,
  database: { status: 'UP', latencyMs: 3, pendingMigrations: 0 },
  counts: { users: 412, blockedUsers: 4 },
  lastWriteAt: {
    USER_BLOCKED: '2026-07-28T12:11:00.000Z',
    USER_DELETED: null,
  },
}

function renderSystemStatus() {
  return render(
    <MantineProvider>
      <SystemStatusPage />
    </MantineProvider>
  )
}

describe('System Status page', () => {
  beforeEach(() => {
    vi.mocked(systemStatusService.getStatus).mockResolvedValue(healthyStatus)
  })

  it('reports health, uptime, counters and last writes', async () => {
    renderSystemStatus()

    expect(await screen.findByText('Backend is ok')).toBeInTheDocument()
    expect(screen.getByText('1d 11h 40m')).toBeInTheDocument()
    expect(screen.getByText('1.4.2')).toBeInTheDocument()
    expect(screen.getByText('3 ms')).toBeInTheDocument()
    expect(screen.getByText('412')).toBeInTheDocument()
    expect(screen.getByText('Blocked users')).toBeInTheDocument()
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('re-reads the status on demand so a write can be confirmed', async () => {
    vi.mocked(systemStatusService.getStatus)
      .mockResolvedValueOnce(healthyStatus)
      .mockResolvedValueOnce({
        ...healthyStatus,
        counts: { users: 412, blockedUsers: 5 },
      })
    const user = userEvent.setup()
    renderSystemStatus()

    expect(await screen.findByText('4')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Refresh now' }))

    expect(await screen.findByText('5')).toBeInTheDocument()
  })

  it('keeps the last reading when a refresh fails', async () => {
    vi.mocked(systemStatusService.getStatus)
      .mockResolvedValueOnce(healthyStatus)
      .mockRejectedValueOnce(new Error('Status probe timed out'))
    const user = userEvent.setup()
    renderSystemStatus()

    await screen.findByText('Backend is ok')
    await user.click(screen.getByRole('button', { name: 'Refresh now' }))

    expect(await screen.findByText(
      'Status probe timed out Showing the last successful reading.'
    )).toBeInTheDocument()
    expect(screen.getByText('Backend is ok')).toBeInTheDocument()
  })

  it('explains when the configured backend has no status endpoint', async () => {
    vi.mocked(systemStatusService.getStatus).mockRejectedValue(new ApiError(404, 'Not found'))
    renderSystemStatus()

    expect(await screen.findByText(
      'The configured backend does not expose a system status endpoint yet. Deploy /system/status, then try again.'
    )).toBeInTheDocument()
    expect(screen.queryByText('Not found')).not.toBeInTheDocument()
  })
})

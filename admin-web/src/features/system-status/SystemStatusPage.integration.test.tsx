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
  startedAt: '2026-07-27T02:00:00.000Z',
  uptimeSeconds: 128_400,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 412, blockedUsers: 4 },
  lastWrite: {
    at: '2026-07-28T12:11:00.000Z',
    ageSeconds: 5340,
    action: 'USER_BLOCKED',
    actorName: 'Admin User',
  },
  gitlabEnabled: false,
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

  it('reports health, uptime, counters and the last write', async () => {
    renderSystemStatus()

    expect(await screen.findByText('API is up, database is ok')).toBeInTheDocument()
    expect(screen.getByText('1d 11h 40m')).toBeInTheDocument()
    expect(screen.getByText('Reachable')).toBeInTheDocument()
    expect(screen.getByText('3 ms')).toBeInTheDocument()
    expect(screen.getByText('412')).toBeInTheDocument()
    expect(screen.getByText('Blocked users')).toBeInTheDocument()
    expect(screen.getByText('User Blocked')).toBeInTheDocument()
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('says counters are unavailable when the database could not be read', async () => {
    vi.mocked(systemStatusService.getStatus).mockResolvedValue({
      ...healthyStatus,
      status: 'DOWN',
      database: { reachable: false, latencyMs: null, error: 'ConnectionRefused' },
      counts: null,
      lastWrite: null,
    })
    renderSystemStatus()

    expect(await screen.findByText('API is up, database is down')).toBeInTheDocument()
    expect(screen.getByText('Unreachable')).toBeInTheDocument()
    expect(screen.getByText('ConnectionRefused')).toBeInTheDocument()
    expect(
      screen.getByText('Counters are unavailable — the backend could not read them from the database.')
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing has been recorded yet.')).toBeInTheDocument()
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

    await screen.findByText('API is up, database is ok')
    await user.click(screen.getByRole('button', { name: 'Refresh now' }))

    expect(await screen.findByText(
      'Status probe timed out Showing the last successful reading.'
    )).toBeInTheDocument()
    expect(screen.getByText('API is up, database is ok')).toBeInTheDocument()
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

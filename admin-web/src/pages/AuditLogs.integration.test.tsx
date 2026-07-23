import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  auditLogsService,
  type AuditLog,
  type AuditMeta,
} from '../api/AuditLogsService'
import AuditLogsPage from './AuditLogs'

vi.mock('../api/AuditLogsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/AuditLogsService')>()
  return {
    ...original,
    auditLogsService: {
      getLogs: vi.fn(),
      getMeta: vi.fn(),
    },
  }
})

const meta: AuditMeta = {
  actors: [{
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@student.kit.edu',
    role: 'ADMIN',
  }],
  actions: ['ADMIN_LOGIN', 'USER_BLOCKED'],
  targetTypes: ['ADMIN_SESSION', 'USER'],
}

const firstLog: AuditLog = {
  id: 'audit-1',
  action: 'USER_BLOCKED',
  createdAt: '2026-07-23T10:00:00.000Z',
  actor: {
    type: 'ADMIN',
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@student.kit.edu',
    role: 'ADMIN',
  },
  target: {
    type: 'USER',
    id: 'user-1',
    label: 'Alice (alice@student.kit.edu)',
  },
  changes: {
    status: { before: 'ACTIVE', after: 'BLOCKED' },
  },
  metadata: {
    reason: 'Repeated abuse',
  },
}

const secondLog: AuditLog = {
  ...firstLog,
  id: 'audit-2',
  action: 'ADMIN_LOGIN',
  target: {
    type: 'ADMIN_SESSION',
    id: 'admin-1',
    label: 'Admin User admin session',
  },
  changes: {
    authenticated: { before: false, after: true },
  },
  metadata: {
    method: 'EMAIL_OTP',
  },
}

function renderAuditLogs() {
  return render(
    <MantineProvider>
      <AuditLogsPage />
    </MantineProvider>
  )
}

describe('Audit Logs page', () => {
  beforeEach(() => {
    vi.mocked(auditLogsService.getMeta).mockResolvedValue(meta)
    vi.mocked(auditLogsService.getLogs).mockResolvedValue({
      auditLogs: [firstLog],
      nextCursor: null,
    })
  })

  it('shows audit events and opens their before/after details', async () => {
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open audit event User Blocked by Admin User',
    }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Audit Event Details')).toBeInTheDocument()
    expect(within(dialog).getByText('Alice (alice@student.kit.edu)')).toBeInTheDocument()
    expect(within(dialog).getByText('ACTIVE')).toBeInTheDocument()
    expect(within(dialog).getByText('BLOCKED')).toBeInTheDocument()
    expect(within(dialog).getByText('Repeated abuse')).toBeInTheDocument()
  })

  it('applies server-side search filters', async () => {
    const user = userEvent.setup()
    renderAuditLogs()
    await screen.findByText('Alice (alice@student.kit.edu)')

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      expect(auditLogsService.getLogs).toHaveBeenLastCalledWith(expect.objectContaining({
        q: 'Alice',
      }))
    })
  })

  it('appends the next cursor page', async () => {
    vi.mocked(auditLogsService.getLogs)
      .mockResolvedValueOnce({ auditLogs: [firstLog], nextCursor: 'next-page' })
      .mockResolvedValueOnce({ auditLogs: [secondLog], nextCursor: null })
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))

    await waitFor(() => expect(auditLogsService.getLogs).toHaveBeenLastCalledWith({}, 'next-page'))
    expect(await screen.findByText('Admin User admin session')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('shows an empty state for filters with no matches', async () => {
    vi.mocked(auditLogsService.getLogs).mockResolvedValue({
      auditLogs: [],
      nextCursor: null,
    })
    renderAuditLogs()

    expect(await screen.findByText('No audit events match these filters.')).toBeInTheDocument()
  })

  it('shows a retryable error when initial loading fails', async () => {
    vi.mocked(auditLogsService.getLogs)
      .mockRejectedValueOnce(new Error('Audit service unavailable'))
      .mockResolvedValueOnce({ auditLogs: [firstLog], nextCursor: null })
    const user = userEvent.setup()
    renderAuditLogs()

    expect(await screen.findByText('Audit service unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Alice (alice@student.kit.edu)')).toBeInTheDocument()
  })
})

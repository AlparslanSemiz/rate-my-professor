import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { FeedbackService } from './FeedbackService'

const API_BASE_URL = 'https://api.test'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createFeedbackService() {
  return new FeedbackService(new ApiClient(API_BASE_URL))
}

describe('FeedbackService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads bug reports from the backend response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      bugReports: [
        {
          id: 'report-1',
          title: 'Crash on login',
          description: 'App crashes when submitting the login form.',
          severity: 'HIGH',
          status: 'OPEN',
          reporterName: 'Alice Smith',
          reportedAt: '2026-06-11T18:30:00Z',
        },
      ],
    }))
    const service = createFeedbackService()

    const reports = await service.getReports()

    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({ id: 'report-1', title: 'Crash on login' })
  })

  it('updates report status with a PATCH request body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated' }))
    const service = createFeedbackService()

    await service.updateReport('report-1', { status: 'REVIEWED' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_BASE_URL}/reports/report-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ status: 'REVIEWED' })
  })

  it('updates report severity with a PATCH request body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated' }))
    const service = createFeedbackService()

    await service.updateReport('report-1', { severity: 'CRITICAL' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_BASE_URL}/reports/report-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ severity: 'CRITICAL' })
  })

  it('surfaces backend errors for a rejected status update', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Bug report not found' }, 404))
    const service = createFeedbackService()

    await expect(service.updateReport('missing-report', { status: 'DISMISSED' })).rejects.toThrow('Bug report not found')
  })
})

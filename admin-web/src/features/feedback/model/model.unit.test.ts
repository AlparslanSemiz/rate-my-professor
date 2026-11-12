import { describe, expect, it } from 'vitest'
import type { BugReport } from '@/api/feedback'
import {
  buildBugReportUpdate,
  canSaveBugReportEdit,
  closedReports,
  createBugReportEditDraft,
  isClosedReport,
  openReports,
  type BugReportEditDraft,
} from './index'

function report(overrides: Partial<BugReport> = {}): BugReport {
  return {
    id: 'report-1',
    title: 'Crash on login',
    description: 'App crashes when submitting the login form.',
    status: 'OPEN',
    severity: 'HIGH',
    reporterName: 'Alice Smith',
    createdAt: '2026-06-01T10:00:00Z',
    issueUrl: null,
    issueState: 'NONE',
    ...overrides,
  } as BugReport
}

function draft(overrides: Partial<BugReportEditDraft> = {}): BugReportEditDraft {
  return { ...createBugReportEditDraft(report()), ...overrides }
}

describe('bug report queue', () => {
  it('treats acted-on and dismissed reports as finished', () => {
    expect(isClosedReport('ACTION_TAKEN')).toBe(true)
    expect(isClosedReport('DISMISSED')).toBe(true)
  })

  it('keeps a reviewed report in the queue, because it is not resolved yet', () => {
    expect(isClosedReport('REVIEWED')).toBe(false)
    expect(isClosedReport('OPEN')).toBe(false)
  })

  it('splits the queue from the history', () => {
    const reports = [
      report({ id: 'a', status: 'OPEN' }),
      report({ id: 'b', status: 'REVIEWED' }),
      report({ id: 'c', status: 'DISMISSED' }),
      report({ id: 'd', status: 'ACTION_TAKEN' }),
    ]

    expect(openReports(reports).map((entry) => entry.id)).toEqual(['a', 'b'])
    expect(closedReports(reports).map((entry) => entry.id)).toEqual(['c', 'd'])
  })
})

describe('bug report edit model', () => {
  it('sends only the fields that changed, trimmed', () => {
    expect(buildBugReportUpdate(report(), draft({ title: '  Crash on sign-in  ' }))).toEqual({
      title: 'Crash on sign-in',
    })
  })

  it('sends nothing when the draft matches the report', () => {
    expect(buildBugReportUpdate(report(), draft())).toEqual({})
  })

  it('refuses to save an unchanged draft', () => {
    expect(canSaveBugReportEdit(report(), draft())).toBe(false)
  })

  it('refuses to save an empty title, because the title is what the report is found by', () => {
    expect(canSaveBugReportEdit(report(), draft({ title: '   ' }))).toBe(false)
  })

  it('allows the description to be cleared', () => {
    const cleared = draft({ description: '' })

    expect(buildBugReportUpdate(report(), cleared)).toEqual({ description: '' })
    expect(canSaveBugReportEdit(report(), cleared)).toBe(true)
  })
})

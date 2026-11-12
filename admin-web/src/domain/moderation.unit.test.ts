import { describe, expect, it } from 'vitest'
import { isReportReason, isReportStatus, isSeverity } from './moderation'

describe('moderation value guards', () => {
  it('accepts supported backend enum values', () => {
    expect(isReportStatus('ACTION_TAKEN')).toBe(true)
    expect(isReportReason('HATE_SPEECH')).toBe(true)
    expect(isSeverity('CRITICAL')).toBe(true)
  })

  it('rejects missing and unsupported values', () => {
    expect(isReportStatus(null)).toBe(false)
    expect(isReportReason('UNKNOWN')).toBe(false)
    expect(isSeverity('URGENT')).toBe(false)
  })
})

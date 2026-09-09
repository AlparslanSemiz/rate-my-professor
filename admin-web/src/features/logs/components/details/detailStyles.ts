import type { CSSProperties } from 'react'
import { chrome } from '@/theme'

/** The card every block of a log entry's details is drawn on. */
export const detailCardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
}

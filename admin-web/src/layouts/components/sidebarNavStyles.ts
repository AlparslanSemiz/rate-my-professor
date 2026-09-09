import type { CSSProperties } from 'react'
import { withAlpha } from '@/utils/color'
import { chrome } from '@/theme'

export const INACTIVE_ICON_COLOR = chrome.textDim

/**
 * No `transition` here: `.nav-interactive` in `src/interactive.css` already declares one, and
 * hover is owned by CSS so the browser has a resting state to animate from.
 */
const buttonBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  width: '100%',
}

export function navButtonStyle(active: boolean, accent: string): CSSProperties {
  return {
    ...buttonBaseStyle,
    // Left undeclared when inactive: an inline `transparent` would beat `.nav-interactive`'s
    // hover rule, which is what the old JavaScript handler existed to work around.
    background: active
      ? `linear-gradient(180deg, ${withAlpha(accent, 0.14)}, ${withAlpha(accent, 0.06)})`
      : undefined,
    border: active ? `1px solid ${withAlpha(accent, 0.22)}` : '1px solid transparent',
    boxShadow: active
      ? `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 14px ${withAlpha(accent, 0.1)}`
      : 'none',
  }
}

export function navIconStyle(active: boolean, accent: string): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: active ? withAlpha(accent, 0.18) : 'rgba(255,255,255,0.05)',
    boxShadow: active
      ? `0 0 0 1px ${withAlpha(accent, 0.22)}, 0 2px 10px ${withAlpha(accent, 0.18)}`
      : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
}

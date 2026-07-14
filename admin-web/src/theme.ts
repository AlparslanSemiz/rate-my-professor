import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'green',
  primaryShade: 6,
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '650',
  },
  radius: {
    xs: '6px',
    sm: '9px',
    md: '12px',
    lg: '16px',
    xl: '22px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.14)',
    md: '0 1px 2px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.16)',
    lg: '0 2px 4px rgba(0,0,0,0.4), 0 18px 44px rgba(0,0,0,0.28)',
  },
  colors: {
    // Slightly warmer, softer neutral scale (less cold GitHub-clone feel)
    dark: [
      '#c9d1d9',
      '#adb5c0',
      '#8a93a1',
      '#6b7482',
      '#474e5a',
      '#2f3540',
      '#232935',
      '#171b23',
      '#12151c',
      '#0b0d12',
    ],
    // Refined, slightly less-neon emerald — kept close to brand green
    green: [
      '#e6f9ef',
      '#c6f0d8',
      '#98e4ba',
      '#66d69a',
      '#40cb81',
      '#2ec46f',
      '#22c55e',
      '#18a84e',
      '#0f8a3f',
      '#036c2f',
    ],
  },
})
